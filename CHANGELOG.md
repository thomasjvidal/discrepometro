# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced PDF processing with better pattern recognition
- Real-time collaboration features
- Advanced reporting and export capabilities

## [1.2.0] - 2024-12-19

### Added
- **Top 5 Most Sold Products Analysis**: Automatic identification and prioritized analysis of the 5 products with highest sales volume
- **CFOP-based Sales Filtering**: Intelligent filtering of sales operations using CFOP codes (5xxx, 6xxx, 7xxx)
- **Inventory Cross-Reference**: Enhanced inventory analysis comparing physical and accounting PDFs
- **Dashboard Ranking Section**: New dedicated section in dashboard with visual ranking indicators
- **Comprehensive Documentation**: Added TOP5_MAIS_VENDIDOS.md with detailed feature documentation

### Changed
- Enhanced `DiscrepanciaReal` interface with new fields:
  - `fonte_inventario_fisico?: number`
  - `fonte_inventario_contabil?: number`
  - `ranking_vendas?: number`
- Updated Dashboard layout to include Top 5 products section
- Improved progress tracking during file processing

### Technical Improvements
- Added `analisarTop5MaisVendidos()` function in `realProcessor.ts`
- Enhanced data processing pipeline with prioritized analysis
- Maintained backward compatibility with existing UI/UX design
- Improved error handling and logging for inventory analysis

### Documentation
- Created comprehensive feature documentation
- Added practical examples and use cases
- Included technical implementation details
- Provided step-by-step usage instructions

## [1.1.0] - 2024-12-18

### Added
- Real PDF processing capabilities using PDF.js-extract
- Excel file processing with ExcelJS
- Supabase integration for data storage
- Real-time discrepancy calculation
- Dashboard with interactive data visualization

### Changed
- Migrated from mock data to real data processing
- Enhanced file upload interface
- Improved error handling and user feedback

## [1.0.0] - 2024-12-17

### Added
- Initial project setup with React + TypeScript + Vite
- Basic UI components using shadcn/ui
- File upload functionality
- Mock data processing and visualization
- Basic discrepancy detection algorithm

---

## Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Version History

- **1.0.0**: Initial release with basic functionality
- **1.1.0**: Real data processing implementation
- **1.2.0**: Top 5 products analysis feature 