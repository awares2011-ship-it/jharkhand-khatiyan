import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'गोपनीयता नीति · Jharkhand Khatiyan',
  description:
    'Jharkhand Khatiyan — Land Info ऐप की गोपनीयता नीति: हम क्या जानकारी इकट्ठा करते हैं, विज्ञापन कैसे दिखते हैं, और आपके अधिकार।',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <p className="eyebrow">गोपनीयता नीति</p>
        <h1>Jharkhand Khatiyan — Land Info</h1>
        <p className="legal-muted">अद्यतन: 11 अक्टूबर 2026</p>

        <section>
          <h2>1. परिचय</h2>
          <p>
            Jharkhand Khatiyan — Land Info एक स्वतंत्र हिंदी-first ऐप है जो झारखंड के भूमि रिकॉर्ड,
            मंडी भाव, योजनाओं, मौसम और समाचार तक पहुँच आसान बनाता है। यह सरकारी ऐप नहीं है और न ही सरकार
            द्वारा समर्थित है। आधिकारिक पोर्टल (JharBhoomi, Bhu-Naksha, JharSewa) के साथ हमारा संपर्क सिर्फ
            लिंक द्वारा होता है।
          </p>
        </section>

        <section>
          <h2>2. हम क्या इकट्ठा करते हैं</h2>
          <ul>
            <li>आपके द्वारा दर्ज की गई जानकारी (जैसे गाँव, खाता नंबर) केवल आपके डिवाइस में संग्रहीत होती है।</li>
            <li>मौसम और समाचार दिखाने के लिए आपके डिवाइस से लाइव डेटा मांगा जाता है — कोई व्यक्तिगत पहचान हमें नहीं भेजी जाती।</li>
            <li>Vercel Analytics ऐप के प्रदर्शन (page views, performance) का anonymised माप रखता है।</li>
          </ul>
        </section>

        <section>
          <h2>3. विज्ञापन (Google AdMob)</h2>
          <p>
            हम Google AdMob के माध्यम से विज्ञापन दिखाते हैं ताकि ऐप मुफ्त रह सके। AdMob विज्ञापन
            व्यक्तिगत बनाने के लिए एक गुमनाम विज्ञापन पहचानकर्ता (Advertising ID) और सीमित डिवाइस
            जानकारी (भाषा, क्षेत्र, डिवाइस प्रकार) का उपयोग कर सकता है। आप Android सेटिंग्स → Google
            → विज्ञापन से इसे रीसेट या सीमित कर सकते हैं।
          </p>
          <p>
            विस्तृत जानकारी के लिए देखें:{' '}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
              Google विज्ञापन नीति
            </a>
          </p>
        </section>

        <section>
          <h2>4. अनुमतियाँ</h2>
          <ul>
            <li><b>इंटरनेट</b> — मौसम, समाचार और सरकारी पोर्टल खोलने के लिए।</li>
            <li><b>सूचनाएँ</b> — आपकी अनुमति के बाद ही लॉक-स्क्रीन पर रंगीन अपडेट भेजे जाते हैं।</li>
            <li><b>लोकेशन</b> — केवल जब आप मौसम कार्ड में "मेरा स्थान" बटन दबाते हैं; हमें नहीं भेजी जाती।</li>
          </ul>
        </section>

        <section>
          <h2>5. आपके अधिकार</h2>
          <p>
            सहेजे गए सभी डेटा आपके डिवाइस में हैं — ऐप अनइंस्टॉल करने पर सब मिट जाता है। किसी भी समय
            सूचनाएँ बंद करने के लिए डिवाइस की सेटिंग्स में जाएँ।
          </p>
        </section>

        <section>
          <h2>6. संपर्क</h2>
          <p>
            इस नीति से जुड़े सवालों के लिए हमसे संपर्क करें: <a href="mailto:supportbreakouttrade@gmail.com">supportbreakouttrade@gmail.com</a>
          </p>
        </section>

        <p className="legal-back">
          <Link href="/">← होम पर वापस जाएँ</Link>
        </p>
      </article>
    </main>
  )
}
