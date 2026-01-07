-- Insert default subscription plans
INSERT INTO "SubscriptionPlan" (
  "name", "displayName", "description", "price", "monthlyCredits",
  "maxBrandPrompts", "setupFee", "hasWhatsAppSupport", "hasPrioritySupport",
  "hasBulkProcessing", "hasAdvancedAnalytics", "hasCustomBranding"
) VALUES
('free', 'Free Plan', 'Perfect for trying out Duma AI', 0, 10, 1, 0, false, false, false, false, false),
('starter', 'Starter Plan', 'Great for small businesses and freelancers', 500000, 100, 3, 2500000, true, false, false, false, false),
('pro', 'Pro Plan', 'Perfect for growing businesses', 1500000, 500, 10, 5000000, true, true, true, true, false),
('enterprise', 'Enterprise Plan', 'For large teams and agencies', 5000000, 2000, 50, 10000000, true, true, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default prompt presets (if PromptPreset table exists)
INSERT INTO "PromptPreset" (
  "name", "description", "prompt", "category", "icon", "order"
) VALUES
('Clean White Background', 'Replace background with clean white', 'professional product photography, clean white background, studio lighting, high quality', 'background', 'Square', 1),
('Lifestyle Scene', 'Place product in natural lifestyle setting', 'lifestyle photography, natural setting, ambient lighting, realistic environment', 'background', 'Home', 2),
('Premium Studio', 'High-end studio photography look', 'premium studio photography, professional lighting, luxury presentation, commercial quality', 'enhancement', 'Crown', 3),
('Color Enhancement', 'Enhance and boost colors', 'vibrant colors, enhanced saturation, professional color grading, crisp details', 'enhancement', 'Palette', 4),
('Minimal Clean', 'Minimal and clean aesthetic', 'minimal design, clean composition, modern aesthetic, professional presentation', 'enhancement', 'Minimize', 5),
('Natural Lighting', 'Soft natural lighting enhancement', 'natural lighting, soft shadows, warm tones, organic feel', 'enhancement', 'Sun', 6)
ON CONFLICT DO NOTHING;