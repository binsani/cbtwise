import { useEffect, forwardRef } from "react";

const TAWK_PROPERTY_ID = "69ad4837d4bfc51c39810ea7";
const TAWK_WIDGET_ID = "1jj6e46q7";

const TawkToChat = forwardRef<HTMLDivElement>(function TawkToChat(_, ref) {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div ref={ref} />;
});

export default TawkToChat;
