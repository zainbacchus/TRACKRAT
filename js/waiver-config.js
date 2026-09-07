/* Waiver document registry.
 *
 * Shared by waiver.html and dashboard.html. This is the SECOND shared module
 * in the project (supabase-config.js is the other) and the exception is
 * deliberate: CURRENT_WAIVER_VERSION must not drift between the signing page
 * and the dashboard banner, or the banner nags forever or never fires at all.
 *
 * Publishing a new version:
 *   1. Commit the new PDF under waiver-docs/ with a NEW filename. Never
 *      overwrite an existing one: signed rows are pinned to the old bytes.
 *   2. shasum -a 256 waiver-docs/<file>.pdf
 *   3. Insert the row into public.waiver_documents and flip is_current.
 *   4. Add the entry below and bump CURRENT_WAIVER_VERSION.
 * Past signatures stay valid and stay visible on the dashboard.
 */

export const CURRENT_WAIVER_VERSION = 'v1-2026';

export const WAIVER_VERSIONS = {
  'v1-2026': {
    label: 'TRACKRAT WAIVER AND RELEASE OF LIABILITY',

    /* sha256 of the committed PDF, and the value that must be in the matching
       public.waiver_documents row. The composite foreign key means a mismatch
       fails the insert (23503) rather than silently recording new bytes.
         shasum -a 256 waiver-docs/trackrat-waiver-v1-2026.pdf */
    sha256: 'a848aec777376746bce01cc1430ee3cc7280097e4aec3218a61fe2ad0d461fff',
    file: '/waiver-docs/trackrat-waiver-v1-2026.pdf',

    /* Verbatim HTML transcript. This is the ACCESSIBLE reading path: an
       untagged PDF does not reflow at 375px and does not read correctly in a
       screen reader. It must match the PDF word for word; a transcript that
       diverges is a legal problem, not just an accessibility one.
       null is supported and simply omits the read-on-page section. */
    transcript: '/waiver-docs/trackrat-waiver-v1-2026.html',

    effectiveOn: '2026-09-07',

    /* Appends a signature and audit page sized to the source's last page.
       Needs zero coordinate tuning and works on any source, so it stays on
       even when `stamps` is populated: the appended page carries the audit
       block (row id, document hash, timestamp) that would never fit in a
       margin. */
    appendSignaturePage: true,

    /* Stamps drawn onto the source pages themselves.
       Coordinates are NORMALISED (0..1). `x` is measured from the left edge.
       `y` is the ANCHOR LINE measured from the TOP of the page, so it can be
       tuned with a ruler on a printout: y = distanceFromTop / pageHeight.
       Text baselines sit on that line; a signature image sits with its BOTTOM
       on it, the way a pen rests on a ruled line.
         page:  1-based integer, or 'last', or 'all'
         w:     signature width as a fraction of page width (height follows the
                image's own aspect ratio)
         size:  text size in points, default 10
         if:    'minor' draws only for an under-18, 'adult' only for an over-18
         maxH:  height ceiling as a fraction of page height (default 0.042);
                a taller signature scales down rather than overlapping the row
                above the rule
         clear: paint a white knockout plate first, so a stamp landing on
                printed content stays legible. Leave false for the signature:
                you want the printed rule visible under the ink.
       Load /waiver?stamp=debug to render labelled boxes at every position. */
    stamps: [
      /* Fills the blank in the opening line: "I agree that I, ______ [NAME OF
         MEMBER] am a member of...". clearW covers the whole span, blank plus
         bracketed label, so the signed copy reads as a completed form however
         long the name is. Coordinates come from the generator's own layout. */
      { field: 'legalName', page: 1, x: 0.1951, y: 0.1889, size: 9.2,
        clear: true, clearW: 0.3109, underline: true },

      { field: 'signature', page: 'last', x: 0.1013, y: 0.7285, w: 0.30, if: 'adult' },
      { field: 'signedOn',  page: 'last', x: 0.5915, y: 0.7285, size: 10, if: 'adult' },
      { field: 'legalName', page: 'last', x: 0.1013, y: 0.7790, size: 10 },

      /* Minors only. On a minor's copy the athlete's own SIGNATURE rule above
         is left blank and only the guardian signs, which is what the document
         intends. On an adult's copy these two stay blank instead. Minority is
         derived from the date of birth, both here and in the database CHECK. */
      { field: 'guardianSignature', page: 'last', x: 0.1013, y: 0.8295, w: 0.30, if: 'minor' },
      { field: 'signedOn',          page: 'last', x: 0.5915, y: 0.8295, size: 10, if: 'minor' },
    ],
  },
};

/* Code of conduct. A SEPARATE agreement from the waiver, versioned and hashed
 * the same way, and agreed to with its own checkbox.
 *
 * RRCA guidance is explicit that a club's code of conduct must be addressed in
 * its own agreement question and must NOT be folded into the waiver of
 * liability. Do not merge the two checkboxes, and do not move this text into
 * the waiver PDF.
 */
export const CURRENT_CONDUCT_VERSION = 'conduct-v1-2026';

export const CONDUCT_VERSIONS = {
  'conduct-v1-2026': {
    label: 'TRACKRAT CODE OF CONDUCT',
    file: '/waiver-docs/trackrat-conduct-v1-2026.html',
    effectiveOn: '2026-09-07',
    /* shasum -a 256 waiver-docs/trackrat-conduct-v1-2026.html */
    sha256: '0eceaf41d8aa36d2ddde4a798e5667c903a9d07e1a546b46d07aefff51ea9d9d',
  },
};

export function currentConduct() {
  return CONDUCT_VERSIONS[CURRENT_CONDUCT_VERSION];
}

export function currentWaiver() {
  return WAIVER_VERSIONS[CURRENT_WAIVER_VERSION];
}
