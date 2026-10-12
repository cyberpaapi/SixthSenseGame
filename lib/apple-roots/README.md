# Apple public trust roots

Downloaded from Apple's PKI on October 12, 2026:
- https://www.apple.com/certificateauthority/AppleRootCA-G2.cer
- https://www.apple.com/certificateauthority/AppleRootCA-G3.cer

Public certificates, not signing secrets. The Apple server library validates signed
transactions against these roots, with online certificate checks enabled. Sandbox
and Production are verified separately; Xcode/local unsigned receipts are rejected.
