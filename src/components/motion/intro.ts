/** sessionStorage key set once the intro has played. */
export const INTRO_SEEN_KEY = "gateways-intro-seen";

/**
 * Runs before first paint: marks the page so CSS hides the intro when it has already played
 * this session, or when the visitor prefers reduced motion.
 */
export const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)})!==null||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`;
