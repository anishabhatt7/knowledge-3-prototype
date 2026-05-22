import { LightningElement, api } from 'lwc';
import { gsap } from 'gsap';

/**
 * Live-collaboration cursor overlay (Google Docs / Figma multiplayer
 * style).
 *
 * Each cursor is rendered as a thin vertical caret + a name pill. Real
 * collaborators "edit" by anchoring their caret to a character offset
 * inside a `[contenteditable]` block in the article body, then GSAP
 * walks the caret forward along the line ("typing") before jumping to
 * a new paragraph.
 *
 * The host is mounted inside `.ra-article__body` (a scroll container)
 * so cursors stay attached to text content as the user scrolls.
 *
 * Props:
 *   collaborators: Array<{ id, name, color }>
 *     `color` is one of: 'pink' | 'teal' | 'amber' | 'indigo'
 */
export default class CollaboratorCursors extends LightningElement {
    static renderMode = 'light';

    @api collaborators = [];

    _animations = [];
    _delayedCalls = [];
    _initialised = false;
    _stepCount = 0;
    _gsapEnabled = true;
    _boundGsapToggle = null;

    connectedCallback() {
        this._boundGsapToggle = (e) => {
            const enabled = e.detail?.enabled !== false;
            if (!enabled && this._gsapEnabled) {
                this._animations.forEach((a) => a.kill());
                this._delayedCalls.forEach((d) => d.kill());
                this._animations = [];
                this._delayedCalls = [];
                const cursors = this.querySelectorAll('.cc-cursor');
                cursors.forEach((el) => {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                    el.classList.remove('cc-cursor_typing');
                });
            } else if (enabled && !this._gsapEnabled) {
                this._initialised = false;
            }
            this._gsapEnabled = enabled;
        };
        window.addEventListener('gsap:toggle', this._boundGsapToggle);
    }

    get cursorRows() {
        return (this.collaborators || []).map((c, i) => ({
            id: c.id,
            name: c.name,
            rootClass: `cc-cursor cc-cursor-${i + 1} cc-cursor_${c.color || 'indigo'}`,
        }));
    }

    renderedCallback() {
        if (this._initialised) return;
        const cursors = this.querySelectorAll('.cc-cursor');
        if (!cursors.length) return;
        this._initialised = true;

        if (!this._gsapEnabled) return;

        cursors.forEach((el, i) => this._spawn(el, i));
    }

    disconnectedCallback() {
        this._animations.forEach((a) => a.kill());
        this._delayedCalls.forEach((d) => d.kill());
        this._animations = [];
        this._delayedCalls = [];
        if (this._boundGsapToggle) {
            window.removeEventListener('gsap:toggle', this._boundGsapToggle);
            this._boundGsapToggle = null;
        }
    }

    // ─── Anchor discovery ──────────────────────────────────────────────
    // Find every editable text block in the article body that has enough
    // characters to "type into".
    _collectAnchors() {
        const body = document.querySelector('.ra-article__body');
        if (!body) return [];
        return Array.from(body.querySelectorAll('[contenteditable="true"]')).filter(
            (el) => (el.textContent || '').trim().length >= 8
        );
    }

    _pickAnchor(seed) {
        const anchors = this._collectAnchors();
        if (!anchors.length) return null;
        return anchors[Math.abs(seed) % anchors.length];
    }

    _textNodeAt(parent, charOffset) {
        const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null);
        let node;
        let remaining = charOffset;
        let last = null;
        while ((node = walker.nextNode())) {
            last = node;
            const len = node.textContent.length;
            if (remaining <= len) return { node, offset: remaining };
            remaining -= len;
        }
        if (last) return { node: last, offset: last.textContent.length };
        return null;
    }

    // Convert a viewport-space rect to coordinates inside `.ra-article__body`'s
    // scrolling content box, since this component sits inside that scroller.
    _toBodyCoord(rect) {
        const body = document.querySelector('.ra-article__body');
        if (!body) return { x: rect.left, y: rect.top, height: rect.height || 18 };
        const bodyBox = body.getBoundingClientRect();
        return {
            x: rect.left - bodyBox.left + body.scrollLeft,
            y: rect.top - bodyBox.top + body.scrollTop,
            height: rect.height || 18,
        };
    }

    _anchorCoord(anchor, ratio) {
        const len = (anchor.textContent || '').length;
        if (!len) return null;
        const offset = Math.floor(Math.max(0, Math.min(0.99, ratio)) * len);
        const tn = this._textNodeAt(anchor, offset);
        if (!tn) return null;
        const range = document.createRange();
        try {
            range.setStart(tn.node, tn.offset);
            range.setEnd(tn.node, tn.offset);
        } catch (e) {
            return null;
        }
        let rect = range.getBoundingClientRect();
        // Empty rect at exact offset 0 — shift to the next char.
        if (rect.height === 0 && rect.width === 0 && tn.node.length > tn.offset) {
            try {
                range.setEnd(tn.node, tn.offset + 1);
                rect = range.getBoundingClientRect();
            } catch (e) {
                /* noop */
            }
        }
        if (rect.height === 0 && rect.width === 0) {
            const fallback = anchor.getBoundingClientRect();
            rect = { left: fallback.left + 12, top: fallback.top + 4, height: fallback.height || 20 };
        }
        return this._toBodyCoord(rect);
    }

    // ─── Animation cycle ───────────────────────────────────────────────
    _spawn(el, index) {
        gsap.set(el, { opacity: 0, scale: 0.85, transformOrigin: 'left bottom' });
        const fadeIn = gsap.delayedCall(0.15 + index * 0.25, () => {
            this._jumpToNewAnchor(el, index, /* fadeIn */ true);
        });
        this._delayedCalls.push(fadeIn);
    }

    _jumpToNewAnchor(el, index, fadeIn = false) {
        if (!this._gsapEnabled) return;
        const seed = index * 17 + this._stepCount++;
        const anchor = this._pickAnchor(seed);
        if (!anchor) {
            const retry = gsap.delayedCall(0.4, () => this._jumpToNewAnchor(el, index, fadeIn));
            this._delayedCalls.push(retry);
            return;
        }
        const startRatio = gsap.utils.random(0.05, 0.55);
        const coord = this._anchorCoord(anchor, startRatio);
        if (!coord) {
            const retry = gsap.delayedCall(0.4, () => this._jumpToNewAnchor(el, index, fadeIn));
            this._delayedCalls.push(retry);
            return;
        }

        el.style.setProperty('--cc-caret-height', `${Math.max(16, coord.height)}px`);
        el.classList.remove('cc-cursor_typing');

        if (fadeIn) {
            // First arrival: snap to position, then fade + scale in.
            gsap.set(el, { x: coord.x, y: coord.y });
            const tween = gsap.to(el, {
                opacity: 1,
                scale: 1,
                duration: 0.35,
                ease: 'back.out(2)',
                onComplete: () => this._typeBurst(el, index, anchor, startRatio),
            });
            this._animations.push(tween);
        } else {
            const tween = gsap.to(el, {
                x: coord.x,
                y: coord.y,
                duration: gsap.utils.random(0.5, 0.85),
                ease: 'power2.inOut',
                onComplete: () => this._typeBurst(el, index, anchor, startRatio),
            });
            this._animations.push(tween);
        }
    }

    // Walk the caret forward inside a single block, character cluster by
    // character cluster, simulating someone typing along a line. Pacing
    // is intentionally on the slow side so it reads as a person typing,
    // not a bot scrubbing the cursor across the line.
    _typeBurst(el, index, anchor, startRatio) {
        if (!this._gsapEnabled) return;
        el.classList.add('cc-cursor_typing');
        const burstCount = Math.floor(gsap.utils.random(5, 9));
        let ratio = startRatio;

        const stepOnce = (n) => {
            if (n >= burstCount || ratio >= 0.95) {
                el.classList.remove('cc-cursor_typing');
                const pause = gsap.utils.random(1.0, 2.0);
                const delayed = gsap.delayedCall(pause, () => this._jumpToNewAnchor(el, index));
                this._delayedCalls.push(delayed);
                return;
            }
            ratio = Math.min(0.99, ratio + gsap.utils.random(0.018, 0.045));
            const coord = this._anchorCoord(anchor, ratio);
            if (!coord) {
                const tween = gsap.to(el, {
                    x: '+=12',
                    duration: 0.85,
                    ease: 'none',
                    onComplete: () => stepOnce(n + 1),
                });
                this._animations.push(tween);
                return;
            }
            el.style.setProperty('--cc-caret-height', `${Math.max(16, coord.height)}px`);
            const tween = gsap.to(el, {
                x: coord.x,
                y: coord.y,
                duration: gsap.utils.random(0.7, 1.15),
                ease: 'none',
                onComplete: () => stepOnce(n + 1),
            });
            this._animations.push(tween);
        };

        stepOnce(0);
    }
}
