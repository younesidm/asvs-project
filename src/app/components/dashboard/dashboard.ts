import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ComplianceService } from '../../services/compliance.service';
import { Requirement } from '../../models/requirement';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  chapters: { id: number; title: string; total: number; passed: number; failed: number; percentage: number }[] = [];
  loading = true;
  exportMenuOpen = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    if (this.complianceService.totalCount() === 0) {
      this.loadData();
    } else {
      this.buildChapterList();
      this.loading = false;
    }
  }

  private loadData(): void {
    this.http.get<any>('/asvs.json').subscribe({
      next: (data) => {
        const transformed: Requirement[] = [];
        Object.keys(data).forEach(chapter => {
          data[chapter].forEach((item: any) => {
            if (item['#']) {
              transformed.push({
                chapter,
                code: item['#'],
                area: item['Area'],
                level: item['ASVS Level'],
                cwe: item['CWE'],
                requirement: item['Verification Requirement'],
                status: null
              });
            }
          });
        });
        this.complianceService.setRequirements(transformed);
        this.buildChapterList();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading ASVS:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildChapterList(): void {
    const reqs = this.complianceService.requirements();
    const chapterNames = [...new Set(reqs.map(r => r.chapter))];
    this.chapters = chapterNames.map((name, i) => {
      const stats = this.complianceService.getChapterStats(name);
      return { id: i + 1, title: name, ...stats };
    });
  }

  get l1Count() { return this.complianceService.requirements().filter(r => r.level === '1').length; }
  get l2Count() { return this.complianceService.requirements().filter(r => r.level === '2').length; }
  get l3Count() { return this.complianceService.requirements().filter(r => r.level === '3').length; }

  getRiskLabel(): string {
    const pct = this.complianceService.scorePercentage();
    if (pct >= 80) return 'Low Risk';
    if (pct >= 50) return 'Medium Risk';
    return 'High Risk';
  }

  getRiskClass(): string {
    const pct = this.complianceService.scorePercentage();
    if (pct >= 80) return 'low';
    if (pct >= 50) return 'medium';
    return 'high';
  }

  toggleExportMenu(): void {
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  exportJSON(type: 'pass' | 'fail' | 'all'): void {
    this.complianceService.exportJSON(type);
    this.exportMenuOpen = false;
  }

  exportExcel(type: 'pass' | 'fail' | 'all'): void {
    this.complianceService.exportExcel(type);
    this.exportMenuOpen = false;
  }

  getTopFailedByChapter(): { chapter: string; count: number }[] {
    return this.chapters
      .filter(c => c.failed > 0)
      .sort((a, b) => b.failed - a.failed)
      .slice(0, 5)
      .map(c => ({ chapter: c.title, count: c.failed }));
  }
}
