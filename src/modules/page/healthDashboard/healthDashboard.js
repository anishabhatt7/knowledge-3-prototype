import { LightningElement } from 'lwc';
import { FIX_QUEUE_DATA } from 'data/sampleArticles';

export default class HealthDashboard extends LightningElement {

  get fixQueueRows() {
    return FIX_QUEUE_DATA.map(item => {
      const isHigh = item.status === 'high';
      const isMedium = item.status === 'medium';

      let priorityIcon = '🟢';
      let priorityBadgeClass = 'priority-badge priority-low';
      if (isHigh) {
        priorityIcon = '🔴';
        priorityBadgeClass = 'priority-badge priority-high';
      } else if (isMedium) {
        priorityIcon = '🟡';
        priorityBadgeClass = 'priority-badge priority-medium';
      }

      let ragScoreClass = 'rag-score rag-good';
      if (item.ragScore < 60) ragScoreClass = 'rag-score rag-poor';
      else if (item.ragScore < 80) ragScoreClass = 'rag-score rag-warning';

      return {
        ...item,
        priorityIcon,
        priorityBadgeClass,
        ragScoreClass,
        rowClass: isHigh ? 'row-high' : (isMedium ? 'row-medium' : ''),
        metadataDisplay: `${item.metadataPercent}%`,
        actionLabel: isHigh ? 'Fix Now' : (isMedium ? 'Review' : 'View')
      };
    });
  }

  get metadataDistribution() {
    const data = [
      { label: '0-25%', count: 3200, color: '#c23934' },
      { label: '26-50%', count: 4100, color: '#ffb75d' },
      { label: '51-75%', count: 3500, color: '#1b96ff' },
      { label: '76-100%', count: 1600, color: '#4bca81' }
    ];

    const max = Math.max(...data.map(d => d.count));

    return data.map(item => ({
      ...item,
      style: `width: ${(item.count / max) * 100}%; background-color: ${item.color};`
    }));
  }

  get ragDistribution() {
    const data = [
      { label: '0-59 (Poor)', count: 2800, fillClass: 'bar-fill bar-poor' },
      { label: '60-79 (Medium)', count: 5600, fillClass: 'bar-fill bar-medium' },
      { label: '80-100 (Good)', count: 4000, fillClass: 'bar-fill bar-good' }
    ];

    const max = Math.max(...data.map(d => d.count));

    return data.map(item => ({
      ...item,
      style: `width: ${(item.count / max) * 100}%;`
    }));
  }

  handleFixArticle(event) {
    // Could trigger navigation to article analyzer with the selected article
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { tab: 'articleAnalyzer' },
      bubbles: true,
      composed: true
    }));
  }
}
