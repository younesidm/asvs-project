import { Injectable, signal, computed } from '@angular/core';
import { Requirement } from '../models/requirement';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {

  private _requirements = signal<Requirement[]>([]);

  readonly requirements = this._requirements.asReadonly();

  readonly totalCount = computed(() => this._requirements().length);

  readonly passedCount = computed(() =>
    this._requirements().filter(r => r.status === 'pass').length
  );

  readonly failedCount = computed(() =>
    this._requirements().filter(r => r.status === 'fail').length
  );

  readonly notReviewedCount = computed(() =>
    this._requirements().filter(r => !r.status).length
  );

  readonly scorePercentage = computed(() => {
    const total = this._requirements().length;
    if (!total) return 0;
    return Math.round((this.passedCount() / total) * 100);
  });

  readonly passPercentage = computed(() => {
    const reviewed = this.passedCount() + this.failedCount();
    if (!reviewed) return 0;
    return Math.round((this.passedCount() / reviewed) * 100);
  });

  setRequirements(reqs: Requirement[]): void {
    this._requirements.set(reqs);
  }

  updateStatus(code: string, status: 'pass' | 'fail' | null): void {
    this._requirements.update(reqs =>
      reqs.map(r => r.code === code ? { ...r, status } : r)
    );
  }

  getPassedRequirements(): Requirement[] {
    return this._requirements().filter(r => r.status === 'pass');
  }

  getFailedRequirements(): Requirement[] {
    return this._requirements().filter(r => r.status === 'fail');
  }

  getByChapter(chapter: string): Requirement[] {
    return this._requirements().filter(r => r.chapter === chapter);
  }

  getChapterStats(chapter: string) {
    const reqs = this.getByChapter(chapter);
    const passed = reqs.filter(r => r.status === 'pass').length;
    const failed = reqs.filter(r => r.status === 'fail').length;
    const total = reqs.length;
    return { passed, failed, total, percentage: total ? Math.round((passed / total) * 100) : 0 };
  }

  exportJSON(type: 'pass' | 'fail' | 'all'): void {
    let data: Requirement[];
    let filename: string;

    if (type === 'pass') {
      data = this.getPassedRequirements();
      filename = 'asvs_passed_requirements.json';
    } else if (type === 'fail') {
      data = this.getFailedRequirements();
      filename = 'asvs_failed_requirements.json';
    } else {
      data = this._requirements();
      filename = 'asvs_all_requirements.json';
    }

    const exportData = data.map(r => ({
      code: r.code,
      chapter: r.chapter,
      area: r.area,
      level: r.level,
      cwe: r.cwe,
      requirement: r.requirement,
      status: r.status || 'not_reviewed'
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, filename);
  }

  exportExcel(type: 'pass' | 'fail' | 'all'): void {
    let data: Requirement[];
    let filename: string;

    if (type === 'pass') {
      data = this.getPassedRequirements();
      filename = 'asvs_passed_requirements.csv';
    } else if (type === 'fail') {
      data = this.getFailedRequirements();
      filename = 'asvs_failed_requirements.csv';
    } else {
      data = this._requirements();
      filename = 'asvs_all_requirements.csv';
    }

    const headers = ['Code', 'Chapter', 'Area', 'Level', 'CWE', 'Status', 'Requirement'];
    const rows = data.map(r => [
      r.code || '',
      r.chapter || '',
      r.area || '',
      r.level ? `L${r.level}` : '',
      r.cwe || '',
      r.status || 'not_reviewed',
      `"${(r.requirement || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
