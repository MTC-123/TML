export type UssdLocale = 'fr' | 'ar' | 'amz';

export interface UssdStrings {
  welcome: string;
  verifyProject: string;
  help: string;
  enterProjectCode: string;
  invalidCode: string;
  projectNotFound: string;
  noActiveMilestone: string;
  votePrompt: (projectName: string, milestone: string) => string;
  voteYes: string;
  voteNo: string;
  voteUnsure: string;
  enterOtp: string;
  invalidOtp: string;
  expiredOtp: string;
  usedOtp: string;
  smsFailed: string;
  notRegistered: string;
  alreadyAttested: string;
  notEnrolled: string;
  notReady: string;
  thankYouNegative: string;
  thankYouUnsure: string;
  attestationSuccess: (refCode: string) => string;
  systemError: string;
  invalidInput: string;
  helpText: string;
  languagePrompt: string;
}

export const USSD_STRINGS: Record<UssdLocale, UssdStrings> = {
  fr: {
    welcome: 'CON Bienvenue sur TML\n1. Vérifier un projet\n2. Aide\n3. العربية\n4. ⵜⴰⵎⴰⵣⵉⵖⵜ',
    verifyProject: 'Vérifier un projet',
    help: 'Aide',
    enterProjectCode: 'CON Entrez le code du projet (6 chiffres):',
    invalidCode: 'END Code invalide. Le code doit contenir 6 chiffres.',
    projectNotFound: 'END Projet non trouvé. Vérifiez le code et réessayez.',
    noActiveMilestone: 'END Aucune étape en cours pour ce projet.',
    votePrompt: (p, m) => `CON ${p}, Étape: ${m}\n1. Oui, travaux en cours\n2. Non, pas de progrès\n3. Pas sûr`,
    voteYes: 'Oui, travaux en cours',
    voteNo: 'Non, pas de progrès',
    voteUnsure: 'Pas sûr',
    enterOtp: 'CON Entrez votre code de vérification (6 chiffres):',
    invalidOtp: 'END Code incorrect. Veuillez réessayer.',
    expiredOtp: 'END Code expiré. Veuillez réessayer.',
    usedOtp: 'END Code déjà utilisé. Veuillez réessayer.',
    smsFailed: "END Impossible d'envoyer le SMS. Veuillez réessayer.",
    notRegistered: "END Votre numéro n'est pas enregistré. Veuillez vous inscrire d'abord.",
    alreadyAttested: 'END Vous avez déjà attesté pour cette étape. Réessayez dans 24h.',
    notEnrolled: "END Vous n'êtes pas inscrit pour cette étape.",
    notReady: "END Cette étape n'est pas encore prête pour les attestations citoyennes.",
    thankYouNegative: 'END Merci pour votre réponse. Votre avis a été enregistré.',
    thankYouUnsure: 'END Merci. Vous pouvez réessayer plus tard.',
    attestationSuccess: (ref) => `END Merci! Attestation enregistrée. Réf: ${ref}`,
    systemError: 'END Erreur système. Veuillez réessayer.',
    invalidInput: 'END Entrée invalide. Veuillez réessayer.',
    helpText: 'END TML: plateforme de transparence. Appelez *123# pour vérifier les travaux publics.',
    languagePrompt: 'CON Choisir la langue:\n1. Français\n2. العربية\n3. ⵜⴰⵎⴰⵣⵉⵖⵜ',
  },
  ar: {
    welcome: 'CON مرحبا بكم في TML\n1. تحقق من مشروع\n2. مساعدة\n3. Français\n4. ⵜⴰⵎⴰⵣⵉⵖⵜ',
    verifyProject: 'تحقق من مشروع',
    help: 'مساعدة',
    enterProjectCode: 'CON أدخل رمز المشروع (6 أرقام):',
    invalidCode: 'END رمز غير صالح. يجب أن يحتوي على 6 أرقام.',
    projectNotFound: 'END المشروع غير موجود. تحقق من الرمز وحاول مرة أخرى.',
    noActiveMilestone: 'END لا توجد مرحلة نشطة لهذا المشروع.',
    votePrompt: (p, m) => `CON ${p}، المرحلة: ${m}\n1. نعم، الأشغال جارية\n2. لا، لا تقدم\n3. غير متأكد`,
    voteYes: 'نعم، الأشغال جارية',
    voteNo: 'لا، لا تقدم',
    voteUnsure: 'غير متأكد',
    enterOtp: 'CON أدخل رمز التحقق (6 أرقام):',
    invalidOtp: 'END رمز غير صحيح. حاول مرة أخرى.',
    expiredOtp: 'END انتهت صلاحية الرمز. حاول مرة أخرى.',
    usedOtp: 'END تم استخدام الرمز بالفعل. حاول مرة أخرى.',
    smsFailed: 'END تعذر إرسال الرسالة القصيرة. حاول مرة أخرى.',
    notRegistered: 'END رقمك غير مسجل. يرجى التسجيل أولا.',
    alreadyAttested: 'END لقد شهدت بالفعل لهذه المرحلة. حاول مرة أخرى بعد 24 ساعة.',
    notEnrolled: 'END أنت غير مسجل لهذه المرحلة.',
    notReady: 'END هذه المرحلة ليست جاهزة بعد لشهادات المواطنين.',
    thankYouNegative: 'END شكرا لردك. تم تسجيل رأيك.',
    thankYouUnsure: 'END شكرا. يمكنك المحاولة لاحقا.',
    attestationSuccess: (ref) => `END شكرا! تم تسجيل الشهادة. المرجع: ${ref}`,
    systemError: 'END خطأ في النظام. حاول مرة أخرى.',
    invalidInput: 'END إدخال غير صالح. حاول مرة أخرى.',
    helpText: 'END TML: منصة الشفافية. اتصل *123# للتحقق من الأشغال العمومية.',
    languagePrompt: 'CON اختر اللغة:\n1. Français\n2. العربية\n3. ⵜⴰⵎⴰⵣⵉⵖⵜ',
  },
  amz: {
    welcome: 'CON ⴰⵣⵓⵍ ⴳ TML\n1. ⵙⵏⵊⵎ ⴰⵙⵏⴼⴰⵔ\n2. ⵜⵉⵡⵉⵙⵉ\n3. Français\n4. العربية',
    verifyProject: 'ⵙⵏⵊⵎ ⴰⵙⵏⴼⴰⵔ',
    help: 'ⵜⵉⵡⵉⵙⵉ',
    enterProjectCode: 'CON ⵙⴽⵛⵎ ⵜⴰⵏⴳⴰⵍⵜ ⵏ ⵓⵙⵏⴼⴰⵔ (6 ⵉⵎⴹⴰⵏ):',
    invalidCode: 'END ⵜⴰⵏⴳⴰⵍⵜ ⵓⵔ ⵜⵔⵉ. ⵉⵅⵚⵚⴰ 6 ⵉⵎⴹⴰⵏ.',
    projectNotFound: 'END ⵓⵔ ⵉⵜⵜⵓⴼⴰ ⵓⵙⵏⴼⴰⵔ. ⵙⵏⵊⵎ ⵜⴰⵏⴳⴰⵍⵜ.',
    noActiveMilestone: 'END ⵓⵔ ⵜⵍⵍⴰ ⵜⴰⴼⵓⵍⵜ ⵜⴰⵎⵉⵔⴰⵏⵜ.',
    votePrompt: (p, m) => `CON ${p}, ⵜⴰⴼⵓⵍⵜ: ${m}\n1. ⵢⴰⵀ, ⵉⵅⴷⴷⵎⵏ\n2. ⵓⵀⵓ, ⵓⵔ ⵉⵅⴷⴷⵎⵏ\n3. ⵓⵔ ⵙⵙⵉⵏⵖ`,
    voteYes: 'ⵢⴰⵀ, ⵉⵅⴷⴷⵎⵏ',
    voteNo: 'ⵓⵀⵓ, ⵓⵔ ⵉⵅⴷⴷⵎⵏ',
    voteUnsure: 'ⵓⵔ ⵙⵙⵉⵏⵖ',
    enterOtp: 'CON ⵙⴽⵛⵎ ⵜⴰⵏⴳⴰⵍⵜ ⵏ ⵓⵙⵏⵊⵎ (6 ⵉⵎⴹⴰⵏ):',
    invalidOtp: 'END ⵜⴰⵏⴳⴰⵍⵜ ⵓⵔ ⵜⵔⵉ. ⴰⵍⵙ ⵜⴰⵔⵎⵉⵜ.',
    expiredOtp: 'END ⵜⴼⵜⵜⵓ ⵜⴰⵏⴳⴰⵍⵜ. ⴰⵍⵙ ⵜⴰⵔⵎⵉⵜ.',
    usedOtp: 'END ⵜⵜⵓⵙⵎⵔⵙ ⵜⴰⵏⴳⴰⵍⵜ. ⴰⵍⵙ ⵜⴰⵔⵎⵉⵜ.',
    smsFailed: 'END ⵓⵔ ⵉⵜⵜⵓⵣⵏ SMS. ⴰⵍⵙ ⵜⴰⵔⵎⵉⵜ.',
    notRegistered: 'END ⵓⵔ ⵉⵜⵜⵓⵙⴽⵜⴱ ⵓⵟⵟⵓⵏ ⵏⵏⴽ.',
    alreadyAttested: 'END ⵜⵓⵛⵀⴷⴷ ⵢⴰⴷ. ⴰⵍⵙ ⴷⴼⴼⵉⵔ 24 ⵏ ⵜⵙⵔⴰⴳⵉⵏ.',
    notEnrolled: 'END ⵓⵔ ⵜⵍⵍⵉⴷ ⴳ ⵓⵎⵓⵍⵍⵉ.',
    notReady: 'END ⵓⵔ ⵜⵃⵢⵢⴰ ⵜⴰⴼⵓⵍⵜ ⴰⴷ.',
    thankYouNegative: 'END ⵜⴰⵏⵎⵎⵉⵔⵜ. ⵉⵜⵜⵓⵙⴽⵜⴱ ⵓⵔⴰⵢ ⵏⵏⴽ.',
    thankYouUnsure: 'END ⵜⴰⵏⵎⵎⵉⵔⵜ. ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⴰⵍⵙⴷ ⵜⵉⴽⴽⵍⵜ ⵢⴰⴹⵏ.',
    attestationSuccess: (ref) => `END ⵜⴰⵏⵎⵎⵉⵔⵜ! ⵉⵜⵜⵓⵙⴽⵜⴱ. ⴰⵎⴰⵜⴰⵔ: ${ref}`,
    systemError: 'END ⵜⴰⵣⴳⵍⵜ ⵏ ⵓⵏⴳⵔⴰⵡ. ⴰⵍⵙ ⵜⴰⵔⵎⵉⵜ.',
    invalidInput: 'END ⴰⵙⴽⵛⵎ ⵓⵔ ⵉⵔⵉ. ⴰⵍⵙ ⵜⴰⵔⵎⵉⵜ.',
    helpText: 'END TML: ⴰⵙⵓⵔⵙ ⵏ ⵜⴰⴼⴰⵏⵓⵜ. ⵙⵉⵡⵍ *123# ⵉ ⵓⵙⵏⵊⵎ ⵏ ⵉⵅⴷⴷⵎⵏ ⵉⴳⴷⵓⴷⴰⵏ.',
    languagePrompt: 'CON ⵙⵜⵉ ⵜⵓⵜⵍⴰⵢⵜ:\n1. Français\n2. العربية\n3. ⵜⴰⵎⴰⵣⵉⵖⵜ',
  },
};

export function getStrings(locale: UssdLocale): UssdStrings {
  return USSD_STRINGS[locale];
}

export function detectLocaleFromPhone(_phoneNumber: string): UssdLocale {
  return 'fr';
}
