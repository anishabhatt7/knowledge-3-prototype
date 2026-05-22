import { LightningElement, api } from 'lwc';
import { gsap } from 'gsap';

/**
 * Header avatar stack for live collaborators (Figma DVS frame 1:99544).
 *
 * Renders one overlapping circular avatar per visible collaborator and
 * a small `+N` chip for any extras. Each item pops in with a GSAP
 * back-out scale on mount, mirroring the Figma "collab heads" GIF.
 *
 * Props:
 *   collaborators: Array<{ id, name, color, initials? }>
 *   extraCount: number  (e.g. 1 for the off-screen "+1")
 */
export default class CollaboratorAvatars extends LightningElement {
    static renderMode = 'light';

    @api collaborators = [];
    @api extraCount = 0;

    _initialised = false;
    _animations = [];
    _gsapEnabled = true;
    _boundGsapToggle = null;

    connectedCallback() {
        this._boundGsapToggle = (e) => {
            this._gsapEnabled = e.detail?.enabled !== false;
        };
        window.addEventListener('gsap:toggle', this._boundGsapToggle);
    }

    get avatarRows() {
        return (this.collaborators || []).map((c) => ({
            id: c.id,
            name: c.name,
            initials:
                c.initials ||
                (c.name || '')
                    .split(/\s+/)
                    .map((s) => s.charAt(0))
                    .join('')
                    .slice(0, 2)
                    .toUpperCase(),
            rootClass: `cca-avatar cca-avatar_${c.color || 'indigo'}`,
        }));
    }

    get hasExtra() {
        return Number(this.extraCount) > 0;
    }

    get extraTitle() {
        const n = Number(this.extraCount) || 0;
        return `${n} more collaborator${n === 1 ? '' : 's'}`;
    }

    renderedCallback() {
        if (this._initialised) return;
        const items = this.querySelectorAll('.cca-avatar, .cca-extra');
        if (!items.length) return;
        this._initialised = true;

        if (!this._gsapEnabled) return;

        gsap.set(items, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });
        const tween = gsap.to(items, {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            stagger: 0.12,
            ease: 'back.out(2.4)',
        });
        this._animations.push(tween);
    }

    disconnectedCallback() {
        this._animations.forEach((a) => a.kill());
        this._animations = [];
        if (this._boundGsapToggle) {
            window.removeEventListener('gsap:toggle', this._boundGsapToggle);
            this._boundGsapToggle = null;
        }
    }
}
