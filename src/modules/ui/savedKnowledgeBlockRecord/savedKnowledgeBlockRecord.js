import { LightningElement, api, track } from 'lwc';

export default class SavedKnowledgeBlockRecord extends LightningElement {
  static renderMode = 'light';

  _savedData = null;
  _contentPopulated = false;

  @track _activeTab = 'details';

  @track _collapsed = {
    information: false,
    details: false,
    properties: false,
    channel: false,
    assignment: false,
    translations: false
  };

  // ── Edit modal state ───────────────────────────────────────────────
  @track tocItems = [];
  @track _showEditModal = false;
  @track _editedTitle = '';
  @track _hasEdits = false;
  @track _showConfirmModal = false;
  @track _confirmDate = '';
  _editContentPopulated = false;
  _editedContent = '';

  @api
  get savedData() {
    return this._savedData;
  }
  set savedData(val) {
    this._savedData = val;
    this._contentPopulated = false;
  }

  @api isKbCreationFlow = false;

  get articleTitle() {
    return (this._savedData && this._savedData.articleTitle) || (this.isKbCreationFlow ? 'New Block title' : 'New Knowledge Article');
  }

  get summary() {
    if (this._savedData && this._savedData.summary) {
      return this._savedData.summary;
    }
    const derived = this._deriveSummaryFromDetails(this._savedData && this._savedData.detailsContent);
    return derived || 'Overview of employee benefits eligibility, enrollment deadlines, and plan options.';
  }

  /* Build a 1–2 sentence summary from the Details RTE HTML by stripping
     tags, collapsing whitespace, and taking the first ~240 chars worth of
     plain prose. Skips heading/list-marker fragments to keep the summary
     readable. */
  _deriveSummaryFromDetails(html) {
    if (!html || typeof html !== 'string') return '';
    const text = html
      .replace(/<\s*(h[1-6]|li)\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    let out = '';
    for (const s of sentences) {
      const next = (out + ' ' + s).trim();
      if (next.length > 240 && out) break;
      out = next;
      if (out.length >= 160) break;
    }
    return out.length > 280 ? out.slice(0, 277).trim() + '…' : out;
  }

  get recordType() {
    if (this.isKbCreationFlow) return 'Knowledge Block';
    return (this._savedData && this._savedData.recordType) || 'FAQ (Unified Knowledge)';
  }

  get showTableOfContents() {
    return !this.isKbCreationFlow;
  }

  get breadcrumbLabel() {
    return this.isKbCreationFlow ? 'Knowledge Block' : 'Knowledge';
  }

  get titleFieldLabel() {
    return this.isKbCreationFlow ? 'Knowledge Block Title' : 'Title';
  }

  get showSummaryField() {
    return !this.isKbCreationFlow;
  }

  get numberFieldLabel() {
    return this.isKbCreationFlow ? 'Block number' : 'Article number';
  }

  get recordTypeFieldLabel() {
    return this.isKbCreationFlow ? 'Block Record Type' : 'Article Record Type';
  }

  get viewCountFieldLabel() {
    return this.isKbCreationFlow ? 'Block Total View Count' : 'Article Total View Count';
  }

  // ── Tab switching ──────────────────────────────────────────────────
  get isDetailsTab() { return this._activeTab === 'details'; }
  get isRelatedListsTab() { return this._activeTab === 'related-lists'; }
  get isVersionsTab() { return this._activeTab === 'versions'; }

  get detailsTabClass() { return this._activeTab === 'details' ? 'skr-tab skr-tab--active' : 'skr-tab'; }
  get relatedListsTabClass() { return this._activeTab === 'related-lists' ? 'skr-tab skr-tab--active' : 'skr-tab'; }
  get versionsTabClass() { return this._activeTab === 'versions' ? 'skr-tab skr-tab--active' : 'skr-tab'; }

  handleTabClick(event) {
    this._activeTab = event.currentTarget.dataset.tab;
  }

  get kbUsageArticles() {
    return [
      { id: 'kbu-1', article: 'How do I check the status of...', author: 'Dave George', creationDate: '12/07/2024', version: '1' },
      { id: 'kbu-2', article: 'Solar panel battery lights are...', author: 'Dave George', creationDate: '12/07/2024', version: '2' },
      { id: 'kbu-3', article: 'What kind of marketing supp...', author: 'Dave George', creationDate: '12/07/2024', version: '1' },
      { id: 'kbu-4', article: 'How do I set up auto-paymen...', author: 'Dave George', creationDate: '12/07/2024', version: '3' },
      { id: 'kbu-5', article: 'What kind of marketing supp...', author: 'Dave George', creationDate: '12/07/2024', version: '4' },
    ];
  }

  // ── Section collapse/expand ──────────────────────────────────────────
  handleToggleSection(event) {
    const id = event.currentTarget.dataset.sectionId;
    this._collapsed = { ...this._collapsed, [id]: !this._collapsed[id] };
  }

  // Body classes
  get infoBodyClass() {
    return this._collapsed.information ? 'skr-section__body skr-section__body--hidden' : 'skr-section__body';
  }
  get detailsBodyClass() {
    return this._collapsed.details ? 'skr-section__body skr-section__body--hidden' : 'skr-section__body';
  }
  get propertiesBodyClass() {
    return (this._collapsed.properties ? 'skr-section__body skr-section__body--grid skr-section__body--hidden' : 'skr-section__body skr-section__body--grid');
  }
  get channelBodyClass() {
    return (this._collapsed.channel ? 'skr-section__body skr-section__body--grid skr-section__body--hidden' : 'skr-section__body skr-section__body--grid');
  }
  get assignmentBodyClass() {
    return (this._collapsed.assignment ? 'skr-section__body skr-section__body--grid skr-section__body--hidden' : 'skr-section__body skr-section__body--grid');
  }
  get translationsBodyClass() {
    return (this._collapsed.translations ? 'skr-section__body skr-section__body--grid skr-section__body--hidden' : 'skr-section__body skr-section__body--grid');
  }

  // Chevron icons
  get infoChevron() { return this._collapsed.information ? 'utility:chevronright' : 'utility:chevrondown'; }
  get detailsChevron() { return this._collapsed.details ? 'utility:chevronright' : 'utility:chevrondown'; }
  get propertiesChevron() { return this._collapsed.properties ? 'utility:chevronright' : 'utility:chevrondown'; }
  get channelChevron() { return this._collapsed.channel ? 'utility:chevronright' : 'utility:chevrondown'; }
  get assignmentChevron() { return this._collapsed.assignment ? 'utility:chevronright' : 'utility:chevrondown'; }
  get translationsChevron() { return this._collapsed.translations ? 'utility:chevronright' : 'utility:chevrondown'; }

  renderedCallback() {
    // Populate read-only details display
    if (!this._contentPopulated) {
      const content = this._savedData && this._savedData.detailsContent;
      if (content) {
        const display = this.querySelector('[data-id="detailsDisplay"]');
        if (display) {
          display.innerHTML = content;
          this._contentPopulated = true;
          this._rebuildTocItems(display);
        }
      }
    }
    // Populate edit modal's contenteditable
    if (this._showEditModal && !this._editContentPopulated) {
      const editor = this.querySelector('[data-id="editDetailsEditor"]');
      const content = this._savedData && this._savedData.detailsContent;
      if (editor && content) {
        editor.innerHTML = content;
        this._editContentPopulated = true;
      }
    }
  }

  /* Walk the rendered Details RTE and assemble the side-panel Table of
     Content from its headings + bold runs. h1/h2/h3 are top-level entries;
     <strong> / <b> / inline-bold spans become child entries so any RTE
     content with bold runs gets at least one TOC line item even when the
     author didn't use heading tags. */
  _rebuildTocItems(displayEl) {
    const isBold = (el) => {
      const tag = el.tagName;
      if (tag === 'STRONG' || tag === 'B') return true;
      const fw = (el.style && el.style.fontWeight) || '';
      if (fw === 'bold' || fw === 'bolder') return true;
      if (/^\d+$/.test(fw) && Number(fw) >= 600) return true;
      return false;
    };
    const seen = new Set();
    const candidates = displayEl.querySelectorAll('h1, h2, h3, strong, b, [style*="font-weight"]');
    const items = [];
    candidates.forEach((el, idx) => {
      const tag = el.tagName;
      const isHeading = tag === 'H1' || tag === 'H2' || tag === 'H3';
      if (!isHeading && !isBold(el)) return;
      const label = (el.textContent || '').trim();
      if (!label) return;
      if (seen.has(label)) return;
      seen.add(label);
      const id = el.id || `toc-${idx}`;
      el.id = id;
      const level = tag === 'H1' ? 1 : tag === 'H2' ? 2 : isHeading ? 3 : 3;
      items.push({
        id,
        label,
        level,
        chevronIcon: items.length === 0 ? 'utility:chevrondown' : 'utility:chevronright',
        itemClass: [
          'skr-toc-item',
          items.length === 0 ? 'skr-toc-item--active' : '',
          level >= 2 ? 'skr-toc-item--child' : '',
        ].filter(Boolean).join(' '),
      });
    });
    // Mark each item with hasChildren so leaf rows (and child rows
    // with no further nesting) suppress the chevron in the template.
    // A row is a parent IFF the next row is at a deeper level.
    items.forEach((it, i) => {
      const next = items[i + 1];
      it.hasChildren = !!(next && next.level > it.level);
    });
    this.tocItems = items;
  }

  handleTocItemClick(event) {
    const id = event.currentTarget.dataset.tocId;
    if (!id) return;
    const target = this.querySelector(`#${id}`);
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.tocItems = this.tocItems.map((it) => ({
      ...it,
      chevronIcon: it.id === id ? 'utility:chevrondown' : 'utility:chevronright',
      itemClass: [
        'skr-toc-item',
        it.id === id ? 'skr-toc-item--active' : '',
        it.itemClass.includes('skr-toc-item--child') ? 'skr-toc-item--child' : '',
      ].filter(Boolean).join(' '),
    }));
  }

  // ── Edit modal getters ─────────────────────────────────────────────
  get showEditModal() { return this._showEditModal; }
  get showConfirmModal() { return this._showConfirmModal; }
  get editedTitle() { return this._editedTitle; }
  get isUpdateButtonDisabled() { return !this._hasEdits; }
  get confirmDateValue() { return this._confirmDate; }

  get kbUsageArticleCount() {
    return this.kbUsageArticles.length;
  }

  // ── Edit modal handlers ────────────────────────────────────────────
  handleEditAsDraft() {
    this._editedTitle = this.articleTitle;
    this._editedContent = (this._savedData && this._savedData.detailsContent) || '';
    this._hasEdits = false;
    this._editContentPopulated = false;
    this._showEditModal = true;
  }

  handleEditModalClose() {
    this._showEditModal = false;
    this._hasEdits = false;
    this._editContentPopulated = false;
  }

  handleEditTitleInput(event) {
    this._editedTitle = event.target.value;
    this._hasEdits = true;
  }

  handleEditContentInput() {
    this._hasEdits = true;
  }

  handleEditModalBackdropClick(event) {
    if (event.target === event.currentTarget) {
      this.handleEditModalClose();
    }
  }

  // ── Update All Articles → Confirmation modal ───────────────────────
  handleUpdateAllArticles() {
    const editor = this.querySelector('[data-id="editDetailsEditor"]');
    this._editedContent = editor ? editor.innerHTML : '';
    this._showEditModal = false;
    this._showConfirmModal = true;
  }

  handleConfirmModalClose() {
    this._showConfirmModal = false;
    this._confirmDate = '';
    this._showEditModal = true;
  }

  handleConfirmBackdropClick(event) {
    if (event.target === event.currentTarget) {
      this.handleConfirmModalClose();
    }
  }

  handleConfirmDateChange(event) {
    this._confirmDate = event.target.value;
  }

  handleConfirmUpdate() {
    if (this._savedData) {
      this._savedData = {
        ...this._savedData,
        articleTitle: this._editedTitle,
        detailsContent: this._editedContent,
      };
      this._contentPopulated = false;
    }
    this._showConfirmModal = false;
    this._showEditModal = false;
    this._hasEdits = false;
    this._editContentPopulated = false;
    this._editedContent = '';

    // Update the details display immediately
    requestAnimationFrame(() => {
      const display = this.querySelector('[data-id="detailsDisplay"]');
      if (display && this._savedData && this._savedData.detailsContent) {
        display.innerHTML = this._savedData.detailsContent;
        this._contentPopulated = true;
        this._rebuildTocItems(display);
      }
    });

    this.dispatchEvent(
      new CustomEvent('kbtoast', {
        bubbles: true,
        composed: true,
        detail: { message: `Knowledge block updated and ${this.kbUsageArticleCount} articles queued for update.` },
      })
    );
  }
}
