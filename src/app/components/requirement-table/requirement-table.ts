import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Requirement } from '../../models/requirement';
import { GeminiService } from '../../services/gemini.service';
import { ComplianceService } from '../../services/compliance.service';

@Component({
  selector: 'app-requirement-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requirement-table.html',
  styleUrls: ['./requirement-table.css']
})
export class RequirementTableComponent implements OnChanges {

  @Input() selectedChapter: string = '';

  selectedRequirement: Requirement | null = null;
  searchQuery: string = '';
  selectedLevel: string = 'All';
  selectedStatus: string = 'All';
  currentPage = 1;
  pageSize = 15;
  exportMenuOpen = false;

  constructor(
    private geminiService: GeminiService,
    private cdr: ChangeDetectorRef,
    public complianceService: ComplianceService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedChapter']) {
      this.currentPage = 1;
      this.searchQuery = '';
      this.selectedLevel = 'All';
      this.selectedStatus = 'All';
    }
  }

  get chapterRequirements(): Requirement[] {
    if (!this.selectedChapter) return this.complianceService.requirements();
    return this.complianceService.requirements().filter(r => r.chapter === this.selectedChapter);
  }

  get filteredRequirements(): Requirement[] {
    let list = this.chapterRequirements;

    if (this.selectedLevel !== 'All') {
      list = list.filter(r => r.level === this.selectedLevel);
    }

    if (this.selectedStatus !== 'All') {
      if (this.selectedStatus === 'pass') list = list.filter(r => r.status === 'pass');
      else if (this.selectedStatus === 'fail') list = list.filter(r => r.status === 'fail');
      else if (this.selectedStatus === 'pending') list = list.filter(r => !r.status);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r =>
        (r.requirement?.toLowerCase().includes(q)) ||
        (r.area?.toLowerCase().includes(q)) ||
        (r.code?.toLowerCase().includes(q))
      );
    }

    return list;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRequirements.length / this.pageSize) || 1;
  }

  get paginatedRequirements(): Requirement[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequirements.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onSearchChange(): void { this.currentPage = 1; }
  onFilterChange(): void { this.currentPage = 1; }

  setStatus(req: Requirement, status: 'pass' | 'fail'): void {
    const newStatus = req.status === status ? null : status;
    this.complianceService.updateStatus(req.code, newStatus);
    // Keep modal reference fresh after signal update
    if (this.selectedRequirement && this.selectedRequirement.code === req.code) {
      const fresh = this.complianceService.requirements().find(r => r.code === req.code);
      if (fresh) this.selectedRequirement = fresh;
    }
  }

  async showDetails(req: Requirement): Promise<void> {
    this.selectedRequirement = req;
    if (req.explanation && req.example) return;
    req.loading = true;
    try {
      const result = await this.geminiService.getExplanation(req.requirement);
      req.explanation = result.explanation;
      req.example = result.example;
      req.implementation = result.implementation;
      req.riskLevel = result.riskLevel;
    } catch {
      req.explanation = 'Error generating explanation.';
    }
    req.loading = false;
    this.cdr.detectChanges();
  }

  closeModal(): void { this.selectedRequirement = null; }

  toggleExportMenu(): void { this.exportMenuOpen = !this.exportMenuOpen; }

  exportJSON(type: 'pass' | 'fail' | 'all'): void {
    this.complianceService.exportJSON(type);
    this.exportMenuOpen = false;
  }

  exportExcel(type: 'pass' | 'fail' | 'all'): void {
    this.complianceService.exportExcel(type);
    this.exportMenuOpen = false;
  }

  getPassCount(): number {
    return this.chapterRequirements.filter(r => r.status === 'pass').length;
  }

  getFailCount(): number {
    return this.chapterRequirements.filter(r => r.status === 'fail').length;
  }

  getChapterPercentage(): number {
    const total = this.chapterRequirements.length;
    if (!total) return 0;
    return Math.round((this.getPassCount() / total) * 100);
  }

  getRiskColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'critical': return 'risk-critical';
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return 'risk-medium';
    }
  }
}
