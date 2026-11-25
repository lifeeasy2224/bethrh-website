// The founder marketing opt-in on /signup. The label and the version travel together:
// the database (marketing_consent_texts) keeps the exact wording per version, so a
// consent record can always be tied to what the person saw. To change the wording,
// add a new version in a migration and bump MARKETING_CONSENT_VERSION.
export const MARKETING_CONSENT_VERSION = 'v1';
export const MARKETING_CONSENT_TEXT = 'أرسلوا لي نصائح المؤسسين وأخبار بذرة والعروض. يمكنني إلغاء الاشتراك في أي وقت.';
