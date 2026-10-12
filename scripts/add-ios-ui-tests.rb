# Build-only test target; does not modify release application code.
require 'xcodeproj'
project = Xcodeproj::Project.open('ios/App/App.xcodeproj')
app = project.targets.find { |target| target.name == 'App' }
test = project.targets.find { |target| target.name == 'AppUITests' } || project.new_target(:ui_test_bundle, 'AppUITests', :ios, '15.0')
group = project.main_group.find_subpath('AppUITests', true)
group.set_source_tree('<group>')
group.set_path('AppUITests')
file = group.new_file('GameScreenshots.swift')
test.add_file_references([file])
test.add_dependency(app)
test.build_configurations.each do |config|
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['TEST_TARGET_NAME'] = 'App'
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.sensei.sixthsense.uitests'
  config.build_settings['PRODUCT_NAME'] = 'AppUITests'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_test_target(test)
scheme.set_launch_target(app)
scheme.save_as('ios/App/App.xcodeproj', 'AppScreenshots', true)
