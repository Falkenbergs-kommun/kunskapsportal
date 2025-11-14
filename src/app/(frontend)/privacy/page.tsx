import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Integritetspolicy',
  description: 'Information om personuppgiftsbehandling i Kunskapsportalen',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Integritetspolicy</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Personuppgiftsansvarig</h2>
        <p className="mb-2">
          <strong>Kommunstyrelseförvaltningen, Falkenbergs kommun</strong>
        </p>
        <p className="mb-2">
          Kontakta dataskyddsombudet för frågor om personuppgiftsbehandling.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Vilka personuppgifter behandlar vi?</h2>

        <h3 className="text-xl font-semibold mb-3 mt-6">Systemanvändare</h3>
        <p className="mb-2">
          För redaktörer och administratörer som har användarkonton i systemet behandlar vi:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>E-postadress (för inloggning)</li>
          <li>Lösenord (krypterat)</li>
          <li>Roll (redaktör/administratör)</li>
          <li>Tilldelade avdelningar</li>
        </ul>
        <p className="mb-4">
          <strong>Dessa uppgifter skickas aldrig till AI-tjänster.</strong> De lagras endast internt i systemet hos vår hostingleverantör Glesys i Sverige.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">Personuppgifter i dokumentinnehåll</h3>
        <p className="mb-2">
          Dokumentinnehåll (rutiner, lathundar, organisationsdokument) är i första hand av allmän karaktär. Personuppgifter kan förekomma i begränsad omfattning när det är nödvändigt för dokumentets funktion, exempelvis:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>Namn</li>
          <li>Befattningar och avdelningar</li>
          <li>Tjänstliga kontaktuppgifter (e-post, telefon)</li>
        </ul>
        <p className="mb-4">
          Endast öppen och allmän information (informationsklass 0-1) behandlas i systemet. Konfidentiell information kan inte publiceras.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Varför behandlar vi personuppgifter?</h2>
        <p className="mb-4">
          Systemet är ett verktyg för dokumenthantering och kunskapsdelning. Syftet är att göra intern dokumentation sökbar och tillgänglig för anställda.
        </p>
        <p className="mb-4">
          <strong>För systemanvändare:</strong> Autentisering och rollbaserad åtkomstkontroll.
        </p>
        <p className="mb-4">
          <strong>För dokumentinnehåll:</strong> AI-assisterad sökning och kunskapsåtervinning genom OCR, textembeddings och chatbot.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Rättslig grund</h2>
        <p className="mb-4">
          Behandlingen grundar sig på <strong>artikel 6.1 e GDPR</strong> - uppgift av allmänt intresse eller myndighetsutövning. Kommunen är en myndighet som enligt kommunallagen (2017:725) har uppgifter av allmänt intresse.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Mottagare av personuppgifter</h2>

        <h3 className="text-xl font-semibold mb-3 mt-6">Intern lagring</h3>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Glesys AB (Sverige):</strong> Hosting av systemet, databaser och infrastruktur. Servrar i Falkenberg.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">Externa AI-tjänster</h3>
        <p className="mb-4">
          <strong>Endast dokumentinnehåll</strong> skickas till följande AI-tjänster för bearbetning:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>OpenAI (USA):</strong> Textembeddings för semantisk sökning. Datalagring: 30 dagar.</li>
          <li><strong>Google Vertex AI (EU):</strong> AI-chat, OCR och metadatagenerering. Data behandlas i EU-region. Datalagring: 55 dagar.</li>
          <li><strong>Mistral AI (Frankrike):</strong> Alternativ OCR-bearbetning. ZDR (Zero Data Retention).</li>
        </ul>
        <p className="mb-4">
          Alla leverantörer har personuppgiftsbiträdesavtal (PUB-avtal) med kommunen. Överföring till USA (OpenAI) sker med standardavtalsklausuler enligt GDPR.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Lagringsperiod</h2>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Systemanvändare:</strong> Under anställningstid och enligt arkivlagen.</li>
          <li><strong>Dokumentinnehåll:</strong> Så länge dokumenten är relevanta för verksamheten.</li>
          <li><strong>Hos AI-leverantörer:</strong> 30-55 dagar för monitoring, därefter automatisk radering.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Dina rättigheter</h2>
        <p className="mb-4">
          Du har följande rättigheter enligt GDPR:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Rätt till tillgång (artikel 15):</strong> Du kan begära utdrag av dina personuppgifter.</li>
          <li><strong>Rätt till rättelse (artikel 16):</strong> Du kan begära rättelse av felaktiga uppgifter.</li>
          <li><strong>Rätt till radering (artikel 17):</strong> Begränsningar kan gälla p.g.a. arkivlagen.</li>
          <li><strong>Rätt till begränsning (artikel 18):</strong> Du kan begära att behandlingen begränsas.</li>
          <li><strong>Rätt att göra invändningar (artikel 21):</strong> Begränsad då behandlingen grundar sig på allmänt intresse.</li>
          <li><strong>Rätt att klaga:</strong> Du har rätt att klaga till Integritetsskyddsmyndigheten (IMY).</li>
        </ul>
        <p className="mb-4">
          Kontakta dataskyddsombudet för att utöva dina rättigheter.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Dataskydd och säkerhet</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Teknisk spärr: Endast informationsklass 0-1 (Öppen och Allmän) kan publiceras</li>
          <li>Krypterad kommunikation (TLS 1.3)</li>
          <li>Rollbaserad åtkomstkontroll</li>
          <li>Regelbundna säkerhetskopior</li>
          <li>Användarkonton skyddade med krypterade lösenord</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Mer information</h2>
        <p className="mb-4">
          En fullständig dataskyddskonsekvensbedömning (DPIA) finns tillgänglig för detaljerad information om personuppgiftsbehandlingen.
        </p>
        <p className="mb-4">
          Vid frågor, kontakta dataskyddsombudet på Falkenbergs kommun.
        </p>
      </section>

      <footer className="mt-12 pt-6 border-t text-sm text-gray-600">
        <p>Falkenbergs kommun | Kommunstyrelseförvaltningen</p>
      </footer>
    </div>
  )
}
