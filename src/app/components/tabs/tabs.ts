import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Requirement } from '../../models/requirement';
import { RequirementTableComponent } from '../requirement-table/requirement-table';
import { ComplianceService } from '../../services/compliance.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, RequirementTableComponent],
  templateUrl: './tabs.html',
  styleUrls: ['./tabs.css']
})
export class TabsComponent implements OnInit {

  chapters: string[] = [];
  selectedChapter: string = '';
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public complianceService: ComplianceService
  ) {}

  ngOnInit(): void {
    if (this.complianceService.totalCount() === 0) {
      this.loadRequirements();
    } else {
      this.chapters = [...new Set(this.complianceService.requirements().map(r => r.chapter))];
      if (this.chapters.length > 0) this.selectedChapter = this.chapters[0];
      this.loading = false;
    }
  }

  private loadRequirements(): void {
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
        this.chapters = [...new Set(transformed.map(r => r.chapter))];
        if (this.chapters.length > 0) this.selectedChapter = this.chapters[0];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading JSON:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectChapter(chapter: string): void {
    this.selectedChapter = chapter;
  }

  getChapterIndex(chapter: string): number {
    return this.chapters.indexOf(chapter) + 1;
  }

  getChapterStats(chapter: string) {
    return this.complianceService.getChapterStats(chapter);
  }
}
