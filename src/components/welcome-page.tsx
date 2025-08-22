export default function WelcomePage() {
  return (
    <div className="p-8">
      <h1>Välkommen till den AI-drivna kunskapsbasen!</h1>
      <p>
        Detta system är utformat för att omvandla dina statiska dokument till en dynamisk,
        intelligent och lätt sökbar kunskapsbas. Genom att utnyttja avancerad AI automatiseras hela
        innehållslivscykeln – från skapande och klassificering till upptäckt.
      </p>
      <h2>Kärnflödet</h2>
      <p>Att få in din information i kunskapsbasen är en enkel, AI-assisterad process:</p>
      <ol>
        <li>
          <strong>Ladda upp källdokument</strong>: Börja med att skapa en ny "Artikel" och ladda upp
          dina källfiler. Systemet stöder ett brett utbud av format, inklusive{' '}
          <strong>PDF, Microsoft Word (.docx) och PowerPoint (.pptx)</strong>. Alla
          icke-PDF-dokument konverteras automatiskt för optimal bearbetning.
        </li>
        <li>
          <strong>Generera innehåll med AI</strong>: Klicka på knappen{' '}
          <strong>"Generera med AI"</strong>. Systemet använder kraftfull OCR och språkmodeller (som
          Mistral) för att läsa dina dokument, extrahera all text och alla bilder och strukturera
          informationen till en ren, redigerbar artikel i rich-text-redigeraren.
        </li>
        <li>
          <strong>Generera metadata med AI</strong>: När innehållet har genererats, klicka på{' '}
          <strong>"Generera metadata med AI"</strong>. Systemet analyserar artikelns innehåll för
          att automatiskt föreslå en koncis <strong>Titel</strong>, en hjälpsam{' '}
          <strong>Sammanfattning</strong>, relevanta <strong>Nyckelord</strong> och rätt{' '}
          <strong>Dokumenttyp</strong> baserat på svenska kommunala standarder.
        </li>
        <li>
          <strong>Granska & Publicera</strong>: Granska det AI-genererade innehållet och metadata,
          gör eventuella önskade redigeringar och publicera artikeln. När den är publicerad blir
          artikeln omedelbart sökbar för alla användare.
        </li>
      </ol>
      <hr />
      <h2>Huvudfunktioner förklarade</h2>
      <p>
        Denna plattform är byggd på en samling kraftfulla funktioner som är utformade för att göra
        kunskapshantering sömlös och intelligent.
      </p>
      <h3>🧠 AI-driven innehållsskapande</h3>
      <p>Systemet använder den senaste AI:n för att bearbeta dina uppladdade dokument.</p>
      <ul>
        <li>
          <strong>Stöd för flera format</strong>: Hanterar olika dokumenttyper och konverterar dem
          vid behov för analys.
        </li>
        <li>
          <strong>Intelligent OCR</strong>: <code>MistralOcrService</code> extraherar inte bara text
          utan även inbäddade bilder från dina dokument, vilket bevarar hela kontexten från
          originalfilen.
        </li>
        <li>
          <strong>Strukturerad output</strong>: AI:n kopierar inte bara text; den förstår
          dokumentets struktur och formaterar den med lämpliga rubriker, listor och tabeller direkt
          i redigeraren.
        </li>
      </ul>
      <h3>🏷️ Automatisk metadata & klassificering</h3>
      <p>
        Glöm manuell taggning. <code>generateMetadataEndpoint</code> använder AI (Googles Gemini)
        för att analysera artikelinnehåll och föreslå kritisk metadata, vilket säkerställer
        konsistens och sökbarhet över hela kunskapsbasen. Detta inkluderar:
      </p>
      <ul>
        <li>Titel och sammanfattning</li>
        <li>Dokumenttyp (t.ex. Policy, Riktlinje, Rapport)</li>
        <li>Nyckelord för sökoptimering</li>
        <li>Relevant rättslig grund och målgrupp</li>
      </ul>
      <h3>🔍 Avancerad semantisk sökning</h3>
      <p>Publicerade artiklar lagras inte bara; de förstås.</p>
      <ul>
        <li>
          <strong>Vektorinbäddningar</strong>: Vid publicering omvandlas artikelinnehåll till
          numeriska representationer (inbäddningar) med hjälp av OpenAI:s modeller.
        </li>
        <li>
          <strong>Qdrant vektordatabas</strong>: Dessa inbäddningar lagras i en <code>Qdrant</code>{' '}
          vektordatabas, vilket möjliggör "semantisk sökning."
        </li>
        <li>
          <strong>Fråga, sök inte</strong>: Detta innebär att användare kan ställa frågor på
          naturligt språk (t.ex. "Vad är vår policy för distansarbete?") och få svar från de mest
          relevanta dokumenten, även om de exakta nyckelorden inte används.
        </li>
      </ul>
      <h3>🗂️ Strukturerad bläddring & navigering</h3>
      <p>
        Innehållet är organiserat i en hierarkisk struktur av <strong>avdelningar</strong>.
      </p>
      <ul>
        <li>
          <strong>Hierarkisk sidofält</strong>: Komponenterna <code>AppSidebar</code> och{' '}
          <code>NavWorkspaces</code> bygger automatiskt en navigeringsmeny på flera nivåer från
          avdelningsstrukturen, vilket gör att användare kan bläddra i informationen intuitivt.
        </li>
        <li>
          <strong>Dynamiska brödsmulor</strong>: Komponenterna <code>DynamicBreadcrumb</code> ger
          tydlig navigeringskontext och visar användarna exakt var de befinner sig i kunskapsbasens
          struktur.
        </li>
      </ul>
      <h3>✨ Modern frontend & användarupplevelse</h3>
      <p>Det användarvänliga gränssnittet är byggt för tydlighet och användarvänlighet.</p>
      <ul>
        <li>
          <strong>Rena artikel- och avdelningsvyer</strong>: Komponenterna <code>ArticleView</code>{' '}
          och <code>DepartmentView</code> ger rena, läsbara layouter för att konsumera information.
        </li>
        <li>
          <strong>Live förhandsgranskning</strong>: Redaktörer kan se sina ändringar i en
          realtidsförhandsgranskning medan de redigerar, vilket säkerställer att det slutliga
          resultatet är perfekt.
        </li>
        <li>
          <strong>Favoriter</strong>: Användare kan bokmärka viktiga sidor för snabb åtkomst med
          hjälp av <code>FavoritesProvider</code>.
        </li>
        <li>
          <strong>AI Chat Sidofält</strong>: Ett inbyggt chattgränssnitt (
          <code>sidebar-chat.tsx</code>) låter användare interagera direkt med kunskapsbasens AI,
          ställa frågor och få omedelbara svar baserade på de indexerade dokumenten.
        </li>
      </ul>
    </div>
  )
}
