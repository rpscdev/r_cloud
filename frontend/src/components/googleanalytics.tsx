import { useEffect } from 'react';

const TRACKING_ID = "GTM-5CD6FR4M"; 

const GoogleAnalytics = () => {
  useEffect(() => {
   
    if (!import.meta.env.PROD) {
        console.log("Google Analytics disabled in Development");
        return;
    }

    // 2. Load the Google Analytics Script
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${TRACKING_ID}`;
    document.head.appendChild(script1);

    // 3. Initialize the Configuration
    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${TRACKING_ID}');
    `;
    document.head.appendChild(script2);

    
    return () => {
        document.head.removeChild(script1);
        document.head.removeChild(script2);
    };
  }, []);

  return null;
};

export default GoogleAnalytics;