export type SupportedLanguage = 'English' | 'Hindi' | 'Hinglish' | 'Kannada' | 'Tamil' | 'Telugu' | 'Marathi' | 'Gujarati';

export interface LanguageDef {
  code: string;
  label: string;
  nativeLabel: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageDef> = {
  English: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    speechCode: 'en-IN',
  },
  Hindi: {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    speechCode: 'hi-IN',
  },
  Hinglish: {
    code: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'Hinglish',
    speechCode: 'hi-IN',
  },
  Kannada: {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    speechCode: 'kn-IN',
  },
  Tamil: {
    code: 'ta',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    speechCode: 'ta-IN',
  },
  Telugu: {
    code: 'te',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    speechCode: 'te-IN',
  },
  Marathi: {
    code: 'mr',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    speechCode: 'mr-IN',
  },
  Gujarati: {
    code: 'gu',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    speechCode: 'gu-IN',
  },
};

export const UI_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Navigation & Headers
  'chat.header': {
    English: 'Chat with your design',
    Hindi: 'अपने प्रोग्राम डिज़ाइन के साथ चैट करें',
    Hinglish: 'Apne design ke saath chat karein',
    Kannada: 'ನಿಮ್ಮ ವಿನ್ಯಾಸದೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಿ',
    Tamil: 'உங்கள் வடிவமைப்புடன் அரட்டையடிக்கவும்',
    Telugu: 'మీ డిజైన్‌తో చాట్ చేయండి',
    Marathi: 'तुमच्या डिझाइनशी संवाद साधा',
    Gujarati: 'તમારી ડિઝાઇન સાથે ચેટ કરો',
  },
  'preview.header': {
    English: 'Program Design Preview',
    Hindi: 'प्रोग्राम डिज़ाइन पूर्वावलोकन',
    Hinglish: 'Program Design Preview',
    Kannada: 'ಕಾರ್ಯಕ್ರಮ ವಿನ್ಯಾಸ ಮುನ್ನೋಟ',
    Tamil: 'நிகழ்ச்சி வடிவமைப்பு முன்னோட்டம்',
    Telugu: 'కార్యక్రమ రూపకల్పన ప్రివ్యూ',
    Marathi: 'कार्यक्रम डिझाइन पूर्वावलोकन',
    Gujarati: 'કાર્યક્રમ ડિઝાઇન પૂર્વાવલોકન',
  },
  'input.placeholder': {
    English: 'Describe your challenge or ask a question...',
    Hindi: 'अपनी चुनौती का विवरण दें या कोई प्रश्न पूछें...',
    Hinglish: 'Apna challenge batayein ya question poochein...',
    Kannada: 'ನಿಮ್ಮ ಸವಾಲನ್ನು ವಿವರಿಸಿ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ...',
    Tamil: 'உங்கள் சவாலை விவரிக்கவும் அல்லது கேள்வி கேட்கவும்...',
    Telugu: 'మీ సవాలును వివరించండి లేదా ప్రశ్న అడగండి...',
    Marathi: 'तुमचे आव्हान सांगा किंवा प्रश्न विचारा...',
    Gujarati: 'તમારા પડકારનું વર્ણન કરો અથવા પ્રશ્ન પૂછો...',
  },
  'focus.mode': {
    English: 'Focus Mode',
    Hindi: 'फोकस मोड',
    Hinglish: 'Focus Mode',
    Kannada: 'ಫೋಕಸ್ ಮೋಡ್',
    Tamil: 'கவனம் செலுத்தும் முறை',
    Telugu: 'ఫోకస్ మోడ్',
    Marathi: 'फोकस मोड',
    Gujarati: 'ફોકસ મોડ',
  },
  'download.cta': {
    English: 'Download (.xlsx)',
    Hindi: 'डाउनलोड (.xlsx)',
    Hinglish: 'Download (.xlsx)',
    Kannada: 'ಡೌನ್‌ಲೋಡ್ (.xlsx)',
    Tamil: 'பதிவிறக்கு (.xlsx)',
    Telugu: 'డౌన్‌లోడ్ (.xlsx)',
    Marathi: 'डाउनलोड करा (.xlsx)',
    Gujarati: 'ડાઉનલોડ કરો (.xlsx)',
  },
  'welcome.title': {
    English: 'Welcome to your Programme Design Companion',
    Hindi: 'आपके प्रोग्राम डिज़ाइन कम्पेनियन में आपका स्वागत है',
    Hinglish: 'Aapke Programme Design Companion mein swagat hai',
    Kannada: 'ನಿಮ್ಮ ಕಾರ್ಯಕ್ರಮ ವಿನ್ಯಾಸ ಸಹಾಯಕಕ್ಕೆ ಸುಸ್ವಾಗತ',
    Tamil: 'உங்கள் நிகழ்ச்சி வடிவமைப்பு தோழமைக்கு நல்வரவு',
    Telugu: 'మీ ప్రోగ్రామ్ డిజైన్ కంపానియన్‌కు స్వాగతం',
    Marathi: 'आपल्या प्रोग्राम डिझाइन कंपेनियनमध्ये स्वागत आहे',
    Gujarati: 'તમારા પ્રોગ્રામ ડિઝાઇન સાથીમાં સ્વાગત છે',
  },
  'welcome.subtitle': {
    English: 'I help education leaders design causal, high-fidelity reform programs grounded in institutional delivery cadences.',
    Hindi: 'मैं शिक्षा अधिकारियों को राज्य स्तर पर संस्थागत सुधार कार्यक्रमों को संरचित करने में सहायता करता हूँ।',
    Hinglish: 'Main education leaders ko grounded reform programs design karne mein guide karta hoon.',
    Kannada: 'ನಾನು ಶಿಕ್ಷಣ ಅಧಿಕಾರಿಗಳಿಗೆ ಸಾಂಸ್ಥಿಕ ಸುಧಾರಣಾ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
    Tamil: 'கல்வித் தலைவர்களுக்கு உறுதியான சீர்திருத்தத் திட்டங்களை வடிவமைக்க உதவுகிறேன்.',
    Telugu: 'విద్యారంగ సంస్థాగత సంస్కరణల కార్యక్రమాలను రూపొందించడంలో నేను మీకు సహాయం చేస్తాను.',
    Marathi: 'मी शिक्षण क्षेत्रातील संस्थात्मक सुधारणा कार्यक्रम तयार करण्यास मदत करतो.',
    Gujarati: 'હું શિક્ષણ ક્ષેત્રના સુધારા કાર્યક્રમો તૈયાર કરવામાં સહાય કરું છું.',
  },

  // Interactive Question Prompts for PDC Companion Steps
  'probe.state': {
    English: `You have formulated the challenge:\n> *"{CHALLENGE}"*\n\nTo ground this programme in your specific state administrative structure (e.g. aligning with **State SCERT**, **DIET** academic mentors, and **Cluster Resource Persons / CRCCs**), **which State or region are we designing this for?**\n\nPlease select a State below or type your target district:`,
    Hindi: `आपने यह चुनौती दर्ज की है:\n> *"{CHALLENGE}"*\n\nइस कार्यक्रम को आपकी विशिष्ट राज्य प्रशासनिक संरचना (जैसे **राज्य SCERT**, **DIET** शैक्षणिक सलाहकार, तथा **संकुल संदर्भ व्यक्ति / CRCC**) के साथ जोड़ने हेतु, **हम किस राज्य या क्षेत्र के लिए यह रूपरेखा बना रहे हैं?**\n\nकृपया नीचे दिए गए विकल्पों में से अपना राज्य चुनें या अपने ज़िले का नाम लिखें:`,
    Hinglish: `Aapne challenge enter kiya hai:\n> *"{CHALLENGE}"*\n\nIs programme ko aapke state administrative structure (jaise **SCERT**, **DIET**, aur **CRCCs**) se ground karne ke liye, **yeh programme kis State ke liye design kiya ja raha hai?**\n\nNeeche State select karein ya apna district type karein:`,
    Kannada: `ನೀವು ಈ ಕೆಳಗಿನ ಸವಾಲನ್ನು ರೂಪಿಸಿದ್ದೀರಿ:\n> *"{CHALLENGE}"*\n\nಈ ಕಾರ್ಯಕ್ರಮವನ್ನು ನಿಮ್ಮ ರಾಜ್ಯದ ಆಡಳಿತಾತ್ಮಕ ರಚನೆಯೊಂದಿಗೆ (ಉದಾ. **SCERT**, **DIET**, ಮತ್ತು **CRCC**) ಹೊಂದಿಸಲು, **ನಾವು ಯಾವ ರಾಜ್ಯಕ್ಕಾಗಿ ಇದನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸುತ್ತಿದ್ದೇವೆ?**\n\nದಯವಿಟ್ಟು ಕೆಳಗೆ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ:`,
    Tamil: `உங்கள் சவால் பதிவு செய்யப்பட்டது:\n> *"{CHALLENGE}"*\n\nஇந்தத் திட்டத்தை உங்கள் மாநில கல்வி நிர்வாக அமைப்போடு (**SCERT**, **DIET**, **CRCC**) இணைக்க, **எந்த மாநிலத்திற்காக இதை வடிவமைக்கிறோம்?**\n\nதயவுசெய்து உங்கள் மாநிலத்தைத் தேர்ந்தெடுக்கவும்:`,
    Telugu: `మీరు పేర్కొన్న సవాలు:\n> *"{CHALLENGE}"*\n\nఈ కార్యక్రమాన్ని మీ రాష్ట్ర విద్యా నిర్వహణ వ్యవస్థతో (**SCERT**, **DIET**, **CRCC**) అనుసంధానించడానికి, **మనం ఏ రాష్ట్రం కోసం దీనిని రూపొందిస్తున్నాము?**\n\nదయచేసి మీ రాష్ట్రాన్ని ఎంచుకోండి:`,
    Marathi: `तुम्ही हे आव्हान निश्चित केले आहे:\n> *"{CHALLENGE}"*\n\nहा कार्यक्रम राज्याच्या प्रशासकीय रचनेशी (**SCERT**, **DIET**, आणि **CRCC**) जोडण्यासाठी, **हा कार्यक्रम कोणत्या राज्यासाठी तयार करत आहोत?**\n\nकृपया खालील राज्य निवडा किंवा जिल्ह्याचे नाव लिहा:`,
    Gujarati: `તમે આ પડકાર દાખલ કર્યો છે:\n> *"{CHALLENGE}"*\n\nઆ કાર્યક્રમને તમારા રાજ્યના શૈક્ષણિક માળખા (**SCERT**, **DIET**, અને **CRCC**) સાથે જોડવા માટે, **આપણે કયા રાજ્ય માટે આ બનાવી રહ્યા છીએ?**\n\nકૃપા કરીને નીચેથી રાજ્ય પસંદ કરો:`,
  },

  'ask.impact': {
    English: `Challenge grounded for **{STATE}**!\n\n> *"{CHALLENGE}"*\n\nWhat is the specific **intended student impact** and measurable milestones you want to achieve for students in **{STATE}**?\n\n*(Please write/type your intended impact below — e.g., Grade 2-3 reading fluency benchmarks, non-reader reduction, comprehension goals)*:`,
    Hindi: `चुनौती **{STATE}** के लिए निर्धारित की गई है!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** के छात्रों के लिए आप क्या विशिष्ट **अपेक्षित प्रभाव (Intended Impact)** और मापने योग्य लक्ष्य हासिल करना चाहते हैं?\n\n*(कृपया अपना अपेक्षित प्रभाव नीचे लिखें)*:`,
    Hinglish: `Challenge **{STATE}** ke liye set ho gaya hai!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** ke students ke liye aap kya specific **intended impact** aur measurable goals achieve karna chahte hain?\n\n*(Apna intended impact neeche likhein/type karein)*:`,
    Kannada: `ಸವಾಲು **{STATE}** ಗಾಗಿ ನಿಗದಿಯಾಗಿದೆ!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** ನಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗಾಗಿ ನೀವು ಸಾಧಿಸಲು ಬಯಸುವ ನಿರ್ದಿಷ್ಟ **ಅಪೇಕ್ಷಿತ ಪ್ರಭಾವ (Intended Impact)** ಏನು?\n\n*(ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಪೇಕ್ಷಿತ ಪ್ರಭಾವವನ್ನು ಕೆಳಗೆ ಬರೆಯಿರಿ)*:`,
    Tamil: `சவால் **{STATE}** மாநிலத்திற்காக அமைக்கப்பட்டது!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** மாணவர்களுக்கு நீங்கள் அடைய விரும்பும் குறிப்பிட்ட **அடையாள தாக்கம் (Intended Impact)** என்ன?\n\n*(தயவுசெய்து உங்கள் தாக்கத்தை கீழே எழுதவும்)*:`,
    Telugu: `సవాలు **{STATE}** కోసం సెట్ చేయబడింది!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** లో విద్యార్థుల కోసం మీరు సాధించాలనుకుంటున్న నిర్దిష్ట **ప్రభావ లక్ష్యం (Intended Impact)** ఏమిటి?\n\n*(దయచేసి మీ ప్రభావ లక్ష్యాన్ని క్రింద వ్రాయండి)*:`,
    Marathi: `आव्हान **{STATE}** साठी निश्चित झाले आहे!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** मधील विद्यार्थ्यांसाठी आपण कोणता **अपेक्षित प्रभाव (Intended Impact)** साध्य करू इच्छिता?\n\n*(कृपया आपला अपेक्षित प्रभाव खाली लिहा)*:`,
    Gujarati: `પડકાર **{STATE}** માટે નક્કી કરવામાં આવ્યો છે!\n\n> *"{CHALLENGE}"*\n\n**{STATE}** ના વિદ્યાર્થીઓ માટે તમે કયો ચોક્કસ **અપેક્ષિત પ્રભાવ (Intended Impact)** પ્રાપ્ત કરવા માંગો છો?\n\n*(કૃપા કરીને તમારો અપેક્ષિત પ્રભાવ નીચે લખો)*:`,
  },

  'ask.stakeholders': {
    English: `Intended student impact recorded!\n\n{IMPACTS}\n\nNow, who needs to change what they do? Select the key delivery stakeholders and administrative cadres responsible for driving this reform in **{STATE}**:`,
    Hindi: `अपेक्षित छात्र प्रभाव दर्ज कर लिया गया है!\n\n{IMPACTS}\n\nअब, इस सुधार को प्रभावी बनाने के लिए किन हितधारकों को अपनी कार्यशैली में बदलाव करना होगा? **{STATE}** में इस सुधार को लागू करने वाले मुख्य हितधारकों और संवर्गों का चयन करें:`,
    Hinglish: `Student impact record ho gaya hai!\n\n{IMPACTS}\n\nAb, kinko apni practice badalni hogi? **{STATE}** mein is reform ko drive karne wale key delivery stakeholders select karein:`,
    Kannada: `ವಿದ್ಯಾರ್ಥಿ ಪ್ರಭಾವವನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ!\n\n{IMPACTS}\n\nಈ ಸುಧಾರಣೆಯನ್ನು ಜಾರಿಗೆ ತರಲು ಯಾರ ಕಾರ್ಯವೈಖರಿ ಬದಲಾಗಬೇಕು? **{STATE}** ಗಾಗಿ ಪ್ರಮುಖ ಪಾಲುದಾರರನ್ನು ಆಯ್ಕೆಮಾಡಿ:`,
    Tamil: `மாணவர் தாக்கம் பதிவு செய்யப்பட்டது!\n\n{IMPACTS}\n\nஇப்போது, யார் தங்கள் நடைமுறைகளை மாற்ற வேண்டும்? **{STATE}** மாநிலத்தில் இச்சீர்திருத்தத்தை முன்னெடுக்கும் முக்கிய பங்குதாரர்களைத் தேர்ந்தெடுக்கவும்:`,
    Telugu: `విద్యార్థి ప్రభావ లక్ష్యం నమోదైంది!\n\n{IMPACTS}\n\nఇప్పుడు, ఈ మార్పును అమలు చేయడానికి ఎవరు తమ పనితీరును మార్చుకోవాలి? **{STATE}** లో ముఖ్యమైన వాటాదారులను ఎంచుకోండి:`,
    Marathi: `विद्यार्थ्यांवरील अपेक्षित प्रभाव नोंदवला गेला आहे!\n\n{IMPACTS}\n\nआता, ही सुधारणा प्रत्यक्षात आणण्यासाठी कोणाची भूमिका बदलायला हवी? **{STATE}** मधील मुख्य घटकांची निवड करा:`,
    Gujarati: `વિદ્યાર્થી પ્રભાવ નોંધવામાં આવ્યો છે!\n\n{IMPACTS}\n\nહવે, આ સુધારાને આગળ ધપાવવા માટે કોની ભૂમિકા બદલવી પડશે? **{STATE}** માં આ સુધારા માટેના મુખ્ય હિતધારકો પસંદ કરો:`,
  },

  'lfa.ready': {
    English: `🎉 **Your Logical Framework is ready!**\n\nThe complete 4×4 causal framework for **{STATE}** is fully synthesized. You can review all sections, indicators, stakeholder workstreams, and download options on the right side preview panel 👉.\n\nFeel free to explore each section or ask me to refine any outcome, activity, or indicator!`,
    Hindi: `🎉 **आपकी लॉजिकल रूपरेखा (LFA) तैयार है!**\n\n**{STATE}** के लिए संपूर्ण 4×4 कार्यप्रणाली और परिणाम ढांचा तैयार कर लिया गया है। आप दाईं ओर दिए गए पूर्वावलोकन पैनल 👉 में सभी अनुभाग, संकेतक और हितधारक कार्यप्रवाह देख सकते हैं।\n\nकिसी भी परिणाम या गतिविधि में सुधार करने के लिए बेझिझक मुझसे कहें!`,
    Hinglish: `🎉 **Aapka Logical Framework ready hai!**\n\n**{STATE}** ke liye complete 4×4 causal framework generate ho chuka hai. Right side preview panel 👉 par aap saare sections, indicators, aur download options dekh sakte hain.\n\nKoi bhi outcome ya activity refine karne ke liye mujhse kahein!`,
    Kannada: `🎉 **ನಿಮ್ಮ ಲಾಜಿಕಲ್ ಫ್ರೇಮ್‌ವರ್ಕ್ ಸಿದ್ಧವಾಗಿದೆ!**\n\n**{STATE}** ಗಾಗಿ ಸಂಪೂರ್ಣ 4×4 ಚೌಕಟ್ಟು ಸಿದ್ಧಗೊಂಡಿದೆ. ಬಲಭಾಗದ ಪೂರ್ವವೀಕ್ಷಣೆ ಫಲಕದಲ್ಲಿ 👉 ಎಲ್ಲಾ ವಿಭಾಗಗಳು, ಸೂಚಕಗಳು ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಆಯ್ಕೆಗಳನ್ನು ನೀವು ಪರಿಶೀಲಿಸಬಹುದು.`,
    Tamil: `🎉 **உங்கள் லாஜிக்கல் கட்டமைப்பு தயாராக உள்ளது!**\n\n**{STATE}** மாநிலத்திற்கான 4×4 கட்டமைப்பு முழுமையாக உருவாக்கப்பட்டுள்ளது. வலது பக்க முன்னோட்டப் பலகத்தில் 👉 அனைத்துப் பிரிவுகளையும் நீங்கள் மதிப்பாய்வு செய்யலாம்.`,
    Telugu: `🎉 **మీ లాజికల్ ఫ్రేమ్‌వర్క్ సిద్ధంగా ఉంది!**\n\n**{STATE}** కోసం పూర్తి 4×4 ఫ్రేమ్‌వర్క్ రూపొందించబడింది. కుడివైపు ప్రివ్యూ ప్యానెల్‌లో 👉 అన్ని విభాగాలు, సూచికలను మీరు సమీక్షించవచ్చు.`,
    Marathi: `🎉 **आपली लॉजिकल फ्रेमवर्क तयार आहे!**\n\n**{STATE}** साठी संपूर्ण 4×4 फ्रेमवर्क पूर्ण झाले आहे. उजव्या बाजूच्या पूर्वावलोकन पॅनेलमध्ये 👉 आपण सर्व विभाग आणि निर्देशांक तपासू शकता.`,
    Gujarati: `🎉 **તમારું લોજિકલ ફ્રેમવર્ક તૈયાર છે!**\n\n**{STATE}** માટે સંપૂર્ણ 4×4 ફ્રેમવર્ક તૈયાર કરવામાં આવ્યું છે. જમણી બાજુના પ્રિવ્યૂ પેનલમાં 👉 તમે બધી વિગતો જોઈ શકો છો.`,
  },

  'confirm.stakeholders': {
    English: `Intended impact and operational delivery choices confirmed!\n\nNow, let's map the core delivery stakeholders and administrative cadres responsible for driving this reform in **{STATE}**:`,
    Hindi: `अपेक्षित प्रभाव और परिचालन वितरण विकल्प स्वीकृत हैं!\n\nअब, आइए **{STATE}** में इस सुधार को आगे बढ़ाने वाले प्रमुख हितधारकों और प्रशासनिक संवर्गों को जोड़ें:`,
    Hinglish: `Intended impact aur operational choices confirm ho gaye hain!\n\nAb, **{STATE}** mein is reform ko drive karne wale delivery stakeholders map karte hain:`,
    Kannada: `ಪ್ರಭಾವದ ಹೇಳಿಕೆ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ಆಯ್ಕೆಗಳನ್ನು ದೃಢೀಕರಿಸಲಾಗಿದೆ!\n\nಈಗ, **{STATE}** ನಲ್ಲಿ ಈ ಸುಧಾರಣೆಯನ್ನು ಜಾರಿಗೆ ತರಲು ಪ್ರಮುಖ ಪಾಲುದಾರರನ್ನು ಮ್ಯಾಪ್ ಮಾಡೋಣ:`,
    Tamil: `தாக்க அறிக்கை உறுதி செய்யப்பட்டது!\n\nஇப்போது, **{STATE}** மாநிலத்தில் இந்த சீர்திருத்தத்தை முன்னெடுக்கும் முக்கிய பங்குதாரர்களை வரைபடமாக்குவோம்:`,
    Telugu: `ప్రభావ ప్రకటన ధృవీకరించబడింది!\n\nఇప్పుడు, **{STATE}** లో ఈ సంస్కరణను ముందుకు తీసుకెళ్లే ముఖ్య వాటాదారులను ఎంచుకుందాం:`,
    Marathi: `प्रभाव विधान निश्चित केले आहे!\n\nआता, **{STATE}** मधील या सुधारणेसाठी जबाबदार असणारे मुख्य घटक आणि प्रशासकीय स्तर जोडूया:`,
    Gujarati: `અપેક્ષિત પ્રભાવ નક્કી કરવામાં આવ્યો છે!\n\nહવે, **{STATE}** માં આ સુધારાને આગળ ધપાવવા માટેના મુખ્ય હિતધારકો અને અધિકારીઓને જોડીએ:`,
  },

  'stakeholders.selected': {
    English: `You have selected the delivery stakeholders & personas for **{STATE}**:\n\nAligning causal roles, classroom coaching rubrics, and administrative monitoring cadences across these institutional tiers...`,
    Hindi: `आपने **{STATE}** के लिए प्रमुख हितधारकों और संवर्गों का चयन किया है:\n\nसभी प्रशासनिक स्तरों में भूमिकाओं, कक्षा मार्गदर्शन और निगरानी रणनीतियों का समन्वय किया जा रहा है...`,
    Hinglish: `Aapne **{STATE}** ke liye delivery stakeholders select kar liye hain:\n\nRoles aur classroom coaching cadences ko align kiya ja raha hai...`,
    Kannada: `ನೀವು **{STATE}** ಗಾಗಿ ಪಾಲುದಾರರನ್ನು ಆಯ್ಕೆಮಾಡಿದ್ದೀರಿ:\n\nತರಗತಿಯ ತರಬೇತಿ ಮತ್ತು ಆಡಳಿತಾತ್ಮಕ ಮೇಲ್ವಿಚಾರಣೆಯನ್ನು ಹೊಂದಿಸಲಾಗುತ್ತಿದೆ...`,
    Tamil: `**{STATE}** மாநிலத்திற்கான பங்குதாரர்களைத் தேர்ந்தெடுத்துள்ளீர்கள்:\n\nகற்பித்தல் வழிகாட்டல் மற்றும் கண்காணிப்பு நடைமுறைகளை ஒருங்கிணைக்கிறோம்...`,
    Telugu: `మీరు **{STATE}** కోసం వాటాదారులను ఎంచుకున్నారు:\n\nతరగతి గది శిక్షణ మరియు పర్యవేక్షణ వ్యూహాలను సమన్వయం చేస్తున్నాము...`,
    Marathi: `तुम्ही **{STATE}** साठी मुख्य घटकांची निवड केली आहे:\n\nप्रशासकीय स्तर आणि वर्गातील अध्यापन पद्धतींचे नियोजन केले जात आहे...`,
    Gujarati: `તમે **{STATE}** માટે હિતધારકોની પસંદગી કરી છે:\n\nવર્ગખંડ માર્ગદર્શન અને દેખરેખ પ્રણાલીનું સંકલન કરવામાં આવી રહ્યું છે...`,
  },

  // 8 Core PDC Framework Section Names
  'section.challenges': {
    English: 'Challenges',
    Hindi: 'चुनौतियाँ',
    Hinglish: 'Challenges',
    Kannada: 'ಸವಾಲುಗಳು',
    Tamil: 'சவால்கள்',
    Telugu: 'సవాళ్లు',
    Marathi: 'आव्हान',
    Gujarati: 'પડકારો',
  },
  'section.impact': {
    English: 'Impact Statement',
    Hindi: 'प्रभाव विवरण',
    Hinglish: 'Impact Statement',
    Kannada: 'ಪ್ರಭಾವದ ಹೇಳಿಕೆ',
    Tamil: 'தாக்க அறிக்கை',
    Telugu: 'ప్రభావ ప్రకటన',
    Marathi: 'प्रभाव विधान',
    Gujarati: 'પ્રભાવ વિધાન',
  },
  'section.interventions': {
    English: 'Interventions',
    Hindi: 'हस्तक्षेप व दृष्टिकोण',
    Hinglish: 'Interventions',
    Kannada: 'ಮಧ್ಯಸ್ಥಿಕೆಗಳು',
    Tamil: 'தலையீடுகள்',
    Telugu: 'జోక్యాలు',
    Marathi: 'हस्तक्षेप',
    Gujarati: 'હસ્તક્ષેપ',
  },
  'section.stakeholders': {
    English: 'Stakeholders',
    Hindi: 'हितधारक व संवर्ग',
    Hinglish: 'Stakeholders',
    Kannada: 'ಪಾಲುದಾರರು',
    Tamil: 'பங்குதாரர்கள்',
    Telugu: 'వాటాదారులు',
    Marathi: 'हितधारक',
    Gujarati: 'હિતધારકો',
  },
  'section.outcomes': {
    English: 'Outcomes',
    Hindi: 'परिणाम व उपलब्धियाँ',
    Hinglish: 'Outcomes',
    Kannada: 'ಫಲಿತಾಂಶಗಳು',
    Tamil: 'முடிவுகள்',
    Telugu: 'ఫలితాలు',
    Marathi: 'परिणाम',
    Gujarati: 'પરિણામો',
  },
  'section.activities': {
    English: 'Activities',
    Hindi: 'गतिविधियाँ व कार्यप्रवाह',
    Hinglish: 'Activities',
    Kannada: 'ಚಟುವಟಿಕೆಗಳು',
    Tamil: 'செயல்பாடுகள்',
    Telugu: 'కార్యకలాపాలు',
    Marathi: 'कृती व उपक्रम',
    Gujarati: 'પ્રવૃત્તિઓ',
  },
  'section.outputs': {
    English: 'Outputs',
    Hindi: 'प्रत्यक्ष उत्पाद (Outputs)',
    Hinglish: 'Outputs',
    Kannada: 'ಉತ್ಪನ್ನಗಳು (Outputs)',
    Tamil: 'வெளியீடுகள்',
    Telugu: 'ఉత్పత్తులు (Outputs)',
    Marathi: 'उत्पादने (Outputs)',
    Gujarati: 'ઉત્પાદનો',
  },
  'section.yourLfa': {
    English: 'Your LFA Matrix',
    Hindi: 'आपकी लॉजिकल रूपरेखा (LFA)',
    Hinglish: 'Your LFA Matrix',
    Kannada: 'ನಿಮ್ಮ LFA ಮ್ಯಾಟ್ರಿಕ್ಸ್',
    Tamil: 'உங்கள் LFA கட்டமைப்பு',
    Telugu: 'మీ LFA మ్యాట్రిక్స్',
    Marathi: 'आपली LFA मॅट्रिक्स',
    Gujarati: 'તમારું LFA મેટ્રિક્સ',
  },
  'not.written': {
    English: 'Not formulated yet.',
    Hindi: 'अभी तक दर्ज नहीं किया गया है।',
    Hinglish: 'Abhi tak enter nahi hua.',
    Kannada: 'ಇನ್ನೂ ರೂಪಿಸಲಾಗಿಲ್ಲ.',
    Tamil: 'இன்னும் உருவாக்கப்படவில்லை.',
    Telugu: 'ఇంకా నమోదు చేయలేదు.',
    Marathi: 'अद्याप नोंदवलेले नाही.',
    Gujarati: 'હજુ સુધી નોંધાયેલ નથી.',
  },
};

export const getLocalizedText = (
  key: string,
  lang: string = 'English',
  variables?: Record<string, string>
): string => {
  const targetLang = (SUPPORTED_LANGUAGES[lang as SupportedLanguage] ? lang : 'English') as SupportedLanguage;
  const translationGroup = UI_TRANSLATIONS[key];
  let text = translationGroup ? (translationGroup[targetLang] || translationGroup['English']) : key;

  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }

  return text;
};
