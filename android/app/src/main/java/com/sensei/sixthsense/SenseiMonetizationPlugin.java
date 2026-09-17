package com.sensei.sixthsense;

import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.*;
import com.google.android.gms.ads.rewarded.*;
import com.google.android.ump.*;
import com.android.billingclient.api.*;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "SenseiMonetization")
public class SenseiMonetizationPlugin extends Plugin {
    private SharedPreferences prefs;
    private ConsentInformation consent;
    private BillingClient billing;
    private AdView banner;
    private FrameLayout bannerHost;
    private RewardedAd rewarded;
    private boolean initialized, adsStarted, loadingReward, bannerWanted, bannerLoaded, fullscreen, purchaseBusy, restoreBusy;
    private String price = "", ageBand = "", message = "";
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private PluginCall rewardCall;

    @Override public void load() {
        prefs = getContext().getSharedPreferences("sensei-monetization", 0);
        ageBand = prefs.getString("ageBand", "");
        consent = UserMessagingPlatform.getConsentInformation(getContext());
    }

    private boolean owned() {
        // Refresh via Play on each foreground. A bounded offline grace avoids taking away a paid benefit during outages.
        return prefs.getBoolean("owned", false) && System.currentTimeMillis() - prefs.getLong("verifiedAt", 0) < 7L * 86400000;
    }
    private boolean eligible() { return !ageBand.isEmpty() && !ageBand.equals("under13"); }
    private JSObject receipt() {
        try { return JSObject.fromJSONObject(new JSONObject(prefs.getString("pendingReward", "{}"))); }
        catch (Exception e) { return new JSObject(); }
    }
    private JSObject status() {
        JSObject data = new JSObject();
        data.put("owned", owned()); data.put("price", price); data.put("ageBand", ageBand);
        data.put("rewardReady", rewarded != null && !fullscreen);
        data.put("rewardLoading", loadingReward); data.put("eligible", eligible());
        data.put("purchaseBusy", purchaseBusy); data.put("message", message);
        data.put("billingReady", billing != null && billing.isReady());
        data.put("privacyOptionsRequired", consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
        data.put("pendingReward", receipt());
        return data;
    }
    private void changed() { notifyListeners("stateChanged", status()); }
    @PluginMethod public void getState(PluginCall call) { getActivity().runOnUiThread(() -> call.resolve(status())); }

    @PluginMethod public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String requested = call.getString("ageBand", ageBand);
            if (!Arrays.asList("under13", "13-15", "16-17", "18+").contains(requested)) { call.resolve(status()); return; }
            ageBand = requested;
            prefs.edit().putString("ageBand", ageBand).apply();
            if (!initialized) {
                initialized = true;
                if (eligible()) { startBilling(); updateConsent(); }
            }
            call.resolve(status());
        });
    }

    private void updateConsent() {
        boolean minor = !ageBand.equals("18+");
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
            .setTagForUnderAgeOfConsent(minor ? RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE : RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG).build());
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(minor).build();
        consent.requestConsentInfoUpdate(getActivity(), params, () ->
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(getActivity(), error -> { startAdsIfAllowed(); changed(); }),
            error -> { message = "Privacy check unavailable. You can keep playing."; startAdsIfAllowed(); changed(); });
    }
    private void startAdsIfAllowed() {
        if (!eligible() || !consent.canRequestAds()) return;
        if (adsStarted) { loadReward(); updateBanner(); return; }
        adsStarted = true;
        MobileAds.initialize(getContext(), result -> main.post(() -> { loadReward(); updateBanner(); }));
    }
    @PluginMethod public void privacyOptions(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            rewarded = null; destroyBanner();
            UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), error -> {
                startAdsIfAllowed(); changed();
                if (error == null) call.resolve(status()); else call.reject("Privacy choices are unavailable right now.");
            });
        });
    }

    @PluginMethod public void setBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> { bannerWanted = call.getBoolean("visible", false); updateBanner(); call.resolve(); });
    }
    private void updateBanner() {
        boolean visible = bannerWanted && !owned() && !fullscreen && eligible() && adsStarted && consent.canRequestAds();
        if (!visible) { if (bannerHost != null) bannerHost.setVisibility(View.GONE); setWebMargin(0); return; }
        if (banner != null) {
            bannerHost.setVisibility(bannerLoaded ? View.VISIBLE : View.GONE);
            setWebMargin(bannerLoaded ? banner.getAdSize().getHeightInPixels(getContext()) + bannerHost.getPaddingTop() : 0);
            return;
        }
        ViewGroup parent = (ViewGroup) getBridge().getWebView().getParent();
        bannerHost = new FrameLayout(getContext());
        CoordinatorLayout.LayoutParams hostParams = new CoordinatorLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        hostParams.gravity = Gravity.BOTTOM;
        parent.addView(bannerHost, hostParams);
        int width = Math.max(1, (int) (getBridge().getWebView().getWidth() / getContext().getResources().getDisplayMetrics().density));
        AdSize size = AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getContext(), width);
        banner = new AdView(getContext()); banner.setAdSize(size); banner.setAdUnitId(BuildConfig.BANNER_AD_ID);
        bannerHost.setPadding(0, (int) (8 * getContext().getResources().getDisplayMetrics().density), 0, 0);
        bannerHost.addView(banner, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER));
        bannerHost.setVisibility(View.GONE);
        final AdView requestedBanner = banner;
        banner.setAdListener(new AdListener() {
            @Override public void onAdLoaded() { if (banner == requestedBanner) { bannerLoaded = true; updateBanner(); } }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { if (banner == requestedBanner) destroyBanner(); }
        });
        banner.loadAd(new AdRequest.Builder().build());
    }
    private void setWebMargin(int bottom) {
        View web = getBridge().getWebView();
        ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) web.getLayoutParams();
        if (params.bottomMargin != bottom) { params.bottomMargin = bottom; web.setLayoutParams(params); }
    }
    private void destroyBanner() {
        bannerLoaded = false;
        if (banner != null) { banner.destroy(); banner = null; }
        if (bannerHost != null) { ((ViewGroup) bannerHost.getParent()).removeView(bannerHost); bannerHost = null; }
        setWebMargin(0);
    }
    private void loadReward() {
        if (!adsStarted || !consent.canRequestAds() || rewarded != null || loadingReward || fullscreen) return;
        loadingReward = true; changed();
        RewardedAd.load(getContext(), BuildConfig.REWARDED_AD_ID, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override public void onAdLoaded(@NonNull RewardedAd ad) { loadingReward = false; rewarded = ad; message = ""; changed(); }
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { loadingReward = false; message = "No reward ad available. Try again later."; changed(); }
        });
    }
    @PluginMethod public void prepareReward(PluginCall call) { getActivity().runOnUiThread(() -> { loadReward(); call.resolve(status()); }); }
    @PluginMethod public void showReward(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            String claim = call.getString("claimId", "");
            int coins = call.getInt("coins", 0);
            String kind = call.getString("kind", "coins");
            boolean extraTry = kind.equals("last-chance") || kind.equals("last-chance-online");
            if (!claim.matches("[a-zA-Z0-9-]{20,80}") || (!extraTry && (!kind.equals("coins") || coins < 1 || coins > 280))) { call.reject("Invalid reward."); return; }
            if (receipt().has("claimId") || prefs.getStringSet("claimed", Collections.emptySet()).contains(claim)) { call.reject("This reward has already been collected or is awaiting recovery."); return; }
            if (!eligible() || rewarded == null || fullscreen || !consent.canRequestAds()) { loadReward(); call.reject("No ad is ready. Please try again."); return; }
            RewardedAd ad = rewarded; rewarded = null; fullscreen = true; rewardCall = call;
            updateBanner(); changed();
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() { finishReward(null); }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) { finishReward("The ad could not open. No reward was claimed."); }
            });
            ad.show(getActivity(), reward -> {
                JSObject pending = new JSObject(); pending.put("claimId", claim); pending.put("coins", extraTry ? 0 : coins); pending.put("kind", kind);
                // Commit before dismissing: recover this receipt after process death, never award on close alone.
                prefs.edit().putString("pendingReward", pending.toString()).commit();
            });
        });
    }
    private void finishReward(String error) {
        fullscreen = false;
        if (rewardCall != null) {
            if (error == null) rewardCall.resolve(status()); else rewardCall.reject(error);
            rewardCall = null;
        }
        updateBanner(); loadReward(); changed();
    }
    @PluginMethod public void acknowledgeReward(PluginCall call) {
        String claim = call.getString("claimId", "");
        if (claim.equals(receipt().optString("claimId"))) {
            Set<String> claimed = new HashSet<>(prefs.getStringSet("claimed", Collections.emptySet())); claimed.add(claim);
            prefs.edit().putStringSet("claimed", claimed).remove("pendingReward").commit();
        }
        call.resolve();
    }

    private void startBilling() {
        billing = BillingClient.newBuilder(getContext()).setListener((result, purchases) -> {
            purchaseBusy = false;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) processPurchases(purchases);
            else { message = result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED ? "Purchase cancelled." : "Purchase unavailable. Please try again."; changed(); }
        }).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).enableAutoServiceReconnection().build();
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) { queryPrice(); restore(); }
                else { message = "Google Play purchases are unavailable on this device."; changed(); }
            }
            @Override public void onBillingServiceDisconnected() { changed(); }
        });
    }
    private QueryProductDetailsParams productQuery() {
        return QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder().setProductId(BuildConfig.REMOVE_ADS_PRODUCT).setProductType(BillingClient.ProductType.INAPP).build())).build();
    }
    private void queryPrice() {
        billing.queryProductDetailsAsync(productQuery(), (result, details) -> main.post(() -> {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && !details.getProductDetailsList().isEmpty()) {
                ProductDetails.OneTimePurchaseOfferDetails offer = details.getProductDetailsList().get(0).getOneTimePurchaseOfferDetails();
                price = offer == null ? "" : offer.getFormattedPrice();
            }
            changed();
        }));
    }
    @PluginMethod public void purchaseRemoveAds(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!eligible() || billing == null || !billing.isReady() || purchaseBusy || owned()) { call.reject("Purchase is not available right now."); return; }
            purchaseBusy = true; changed();
            network.execute(() -> {
                boolean available = false;
                try {
                    HttpURLConnection connection = (HttpURLConnection) URI.create(BuildConfig.VERIFY_PURCHASE_URL).toURL().openConnection();
                    connection.setConnectTimeout(10000); connection.setReadTimeout(10000); connection.setInstanceFollowRedirects(false);
                    if (connection.getResponseCode() == 200) {
                        try (java.io.InputStream in = connection.getInputStream(); java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream()) {
                            byte[] buffer = new byte[1024]; int count;
                            while ((count = in.read(buffer)) != -1) {
                                bytes.write(buffer, 0, count);
                                if (bytes.size() > 4096) throw new IllegalStateException("Invalid readiness response");
                            }
                            available = new JSONObject(bytes.toString("UTF-8")).optBoolean("available", false);
                        }
                    }
                    connection.disconnect();
                } catch (Exception ignored) { /* Never launch payment while verification is unavailable. */ }
                final boolean ready = available;
                main.post(() -> {
                    if (!ready) { purchaseBusy = false; changed(); call.reject("Purchases are not ready yet. Please try again later."); return; }
                    launchPurchase(call);
                });
            });
        });
    }
    private void launchPurchase(PluginCall call) {
            // Fetch fresh Play details/price rather than reusing stale offers.
            billing.queryProductDetailsAsync(productQuery(), (result, details) -> main.post(() -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || details.getProductDetailsList().isEmpty()) { purchaseBusy = false; changed(); call.reject("This product is not available in Google Play yet."); return; }
                ProductDetails product = details.getProductDetailsList().get(0);
                BillingFlowParams.ProductDetailsParams.Builder item = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product);
                ProductDetails.OneTimePurchaseOfferDetails offer = product.getOneTimePurchaseOfferDetails();
                if (offer != null && offer.getOfferToken() != null) item.setOfferToken(offer.getOfferToken());
                BillingResult launched = billing.launchBillingFlow(getActivity(), BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(item.build())).build());
                if (launched.getResponseCode() == BillingClient.BillingResponseCode.OK) call.resolve();
                else { purchaseBusy = false; changed(); call.reject("Google Play could not start the purchase."); }
            }));
    }
    @PluginMethod public void restorePurchases(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (billing == null || !billing.isReady()) { call.reject("Connect to Google Play and try again."); return; }
            message = "Checking Google Play purchases…"; restore(); call.resolve();
        });
    }
    private void restore() {
        if (restoreBusy || billing == null || !billing.isReady()) return;
        restoreBusy = true;
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> main.post(() -> {
            restoreBusy = false;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) processPurchases(purchases);
            else { message = "Could not check purchases. Please try again when connected."; changed(); }
        }));
    }
    private void processPurchases(List<Purchase> purchases) {
        for (Purchase purchase : purchases) if (purchase.getProducts().contains(BuildConfig.REMOVE_ADS_PRODUCT)) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) { message = "Purchase pending. Banners will be removed after payment completes."; changed(); return; }
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) { verifyPurchase(purchase); return; }
        }
        prefs.edit().putBoolean("owned", false).remove("verifiedAt").apply();
        message = "No remove-banner-ads purchase found."; updateBanner(); changed();
    }
    private void verifyPurchase(Purchase purchase) {
        message = "Verifying your purchase…"; changed();
        network.execute(() -> {
            try {
                HttpURLConnection connection = (HttpURLConnection) URI.create(BuildConfig.VERIFY_PURCHASE_URL).toURL().openConnection();
                connection.setConnectTimeout(15000); connection.setReadTimeout(15000);
                connection.setInstanceFollowRedirects(false); connection.setRequestMethod("POST"); connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                JSONObject body = new JSONObject().put("purchaseToken", purchase.getPurchaseToken());
                try (java.io.OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
                int code = connection.getResponseCode();
                if (code != 200) { connection.disconnect(); throw new IllegalStateException("Verification unavailable"); }
                JSONObject response;
                try (java.io.InputStream in = connection.getInputStream(); java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream()) {
                    byte[] buffer = new byte[4096]; int count;
                    while ((count = in.read(buffer)) != -1) bytes.write(buffer, 0, count);
                    response = new JSONObject(bytes.toString("UTF-8"));
                }
                connection.disconnect();
                boolean valid = response.optBoolean("owned", false);
                prefs.edit().putBoolean("owned", valid).putLong("verifiedAt", System.currentTimeMillis()).commit();
                main.post(() -> { message = valid ? "Banner ads removed. Optional reward ads are still available." : "This purchase is no longer active."; if (valid) destroyBanner(); else updateBanner(); changed(); });
            } catch (Exception error) {
                main.post(() -> { message = "Purchase verification is pending. Use Restore purchases when connected."; changed(); });
            }
        });
    }
    @Override protected void handleOnResume() { if (banner != null) banner.resume(); if (initialized) restore(); }
    @Override protected void handleOnConfigurationChanged(android.content.res.Configuration config) {
        // Wait for the new WebView width before choosing an adaptive ad size.
        getBridge().getWebView().post(() -> { destroyBanner(); updateBanner(); });
    }
    @Override protected void handleOnPause() { if (banner != null) banner.pause(); }
    @Override protected void handleOnDestroy() {
        if (banner != null) banner.destroy();
        if (billing != null) billing.endConnection();
        network.shutdown();
    }
}
