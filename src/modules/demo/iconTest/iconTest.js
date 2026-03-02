import { LightningElement, track } from 'lwc';

const STANDARD_ICONS = [
    'account', 'contact', 'lead', 'opportunity', 'case', 'task', 'event',
    'campaign', 'product2', 'pricebook2', 'dashboard', 'report', 'file',
    'user', 'group', 'knowledge', 'announcement', 'approval', 'avatar',
    'award', 'bot', 'coaching', 'data_streams', 'einstein', 'entity',
    'forecasts', 'goals', 'hierarchy', 'household', 'idea', 'individual',
    'insights', 'log_a_call', 'messaging_conversation', 'metric',
    'order', 'orders', 'partner_fund_claim', 'person_account',
    'portal', 'question_feed', 'queue', 'related_list', 'reward',
    'service_contract', 'settings', 'skill', 'social', 'solution',
    'survey', 'team_member', 'thanks', 'timesheet', 'today',
    'topic', 'unmatched', 'visit_templates', 'work_order',
].map(name => ({ name: `standard:${name}`, label: name }));

const UTILITY_ICONS = [
    'add', 'adduser', 'announcement', 'approval', 'arrow_bottom',
    'arrow_left', 'arrow_right', 'arrow_top', 'attach', 'ban',
    'bold', 'bookmark', 'brush', 'bug', 'builder', 'calculator',
    'call', 'cases', 'chart', 'check', 'chevrondown', 'chevronleft',
    'chevronright', 'chevronup', 'clear', 'clock', 'close', 'collapse',
    'comment', 'connected_apps', 'copy', 'cut', 'database',
    'date_input', 'delete', 'desktop', 'download', 'edit', 'email',
    'error', 'expand', 'event', 'favorite', 'feed', 'file',
    'filter', 'forward', 'global_navigation_bar', 'graph', 'groups',
    'help', 'hide', 'home', 'image', 'info', 'insert_tag_field',
    'italic', 'justify_text', 'key', 'knowledge_base', 'layout',
    'left_align_text', 'link', 'list', 'lock', 'logout',
    'magicwand', 'matrix', 'merge', 'metrics', 'muted',
    'new', 'new_window', 'notification', 'number_input',
    'open', 'open_folder', 'overflow', 'package', 'palette',
    'paste', 'pause', 'phone_landscape', 'phone_portrait',
    'play', 'preview', 'print', 'priority', 'question_mark',
    'record', 'redo', 'refresh', 'relate', 'remove',
    'reply', 'right_align_text', 'rotate', 'rows', 'search',
    'settings', 'share', 'shield', 'skip_back', 'skip_forward',
    'slider', 'smiley_and_people', 'sort', 'spinner', 'standard_objects',
    'star', 'stop', 'strikethrough', 'success', 'summary',
    'table', 'tablet_landscape', 'tablet_portrait', 'text',
    'text_background_color', 'text_color', 'threedots', 'threedots_vertical',
    'tile_card_list', 'toggle', 'topic', 'touch_action',
    'trail', 'underline', 'undo', 'unlinked', 'unlock',
    'unmuted', 'up', 'upload', 'user', 'video', 'view',
    'visibilityoff', 'voicemail_drop', 'warning', 'world', 'zoomin', 'zoomout',
].map(name => ({ name: `utility:${name}`, label: name }));

const DOCTYPE_ICONS = [
    'attachment', 'csv', 'excel', 'gdoc', 'gform', 'gpres', 'gsheet',
    'html', 'image', 'mp4', 'overlay', 'pack', 'pdf', 'ppt', 'psd',
    'quip_doc', 'quip_sheet', 'quip_slide', 'rtf', 'slide', 'stypi',
    'txt', 'unknown', 'video', 'visio', 'webex', 'word', 'xml', 'zip',
].map(name => ({ name: `doctype:${name}`, label: name }));

export default class IconTest extends LightningElement {
    @track renderTime = null;
    _renderStart = null;

    connectedCallback() {
        this._renderStart = performance.now();
    }

    renderedCallback() {
        if (this.renderTime === null) {
            this.renderTime = (performance.now() - this._renderStart).toFixed(1);
        }
    }

    get standardIcons() { return STANDARD_ICONS; }
    get utilityIcons()  { return UTILITY_ICONS; }
    get doctypeIcons()  { return DOCTYPE_ICONS; }

    get standardCount() { return STANDARD_ICONS.length; }
    get utilityCount()  { return UTILITY_ICONS.length; }
    get doctypeCount()  { return DOCTYPE_ICONS.length; }
    get totalCount()    { return STANDARD_ICONS.length + UTILITY_ICONS.length + DOCTYPE_ICONS.length; }

    get renderTimeLabel() {
        return this.renderTime !== null ? `${this.renderTime} ms` : '—';
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('navigateback'));
    }
}
