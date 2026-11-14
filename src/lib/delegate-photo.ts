// The membership portal's preset profile photos (mp-frontend/public/profile-photos).
const PROFILE_PHOTOS = ["apple", "clapperboard", "coffee", "oscar", "phone", "studios"];

/** A random-looking but stable photo per delegate, so they look the same on every page. */
export function delegatePhoto(delegateId: string) {
  let hash = 0;
  for (const char of delegateId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `/profile-photos/${PROFILE_PHOTOS[hash % PROFILE_PHOTOS.length]}.webp`;
}
