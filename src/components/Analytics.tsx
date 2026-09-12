import Script from "next/script";

// Google Analytics 4.
//
// The site had no measurement of any kind, so there was no way to tell whether
// a page was read by a thousand people or by nobody — which also made every
// judgement about what to build next a guess.
//
// The measurement ID comes from the environment rather than the source. With
// `NEXT_PUBLIC_GA_ID` unset this component renders nothing and fires no
// request, so local development and preview deploys stay out of the numbers
// unless someone deliberately sets it there.
//
// Client-side navigations are not wired up here on purpose: GA4's enhanced
// measurement counts them through browser history events, which is on by
// default. Adding a manual `page_view` on top would double-count every click.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
