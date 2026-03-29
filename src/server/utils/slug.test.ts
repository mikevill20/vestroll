import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('should convert name to lowercase', () => {
    const slug = generateSlug('Acme Corporation');
    expect(slug).toMatch(/^acme-corporation-[a-z0-9]{6}$/);
  });

  it('should replace spaces with hyphens', () => {
    const slug = generateSlug('Test Company Name');
    expect(slug).toMatch(/^test-company-name-[a-z0-9]{6}$/);
  });

  it('should remove special characters', () => {
    const slug = generateSlug('Test & Co.');
    expect(slug).toMatch(/^test-co-[a-z0-9]{6}$/);
  });

  it('should handle multiple spaces', () => {
    const slug = generateSlug('Test   Company');
    expect(slug).toMatch(/^test-company-[a-z0-9]{6}$/);
  });

  it('should generate unique slugs for same name', () => {
    const slug1 = generateSlug('Acme Corporation');
    const slug2 = generateSlug('Acme Corporation');
    expect(slug1).not.toBe(slug2);
  });

  it('should handle names with leading/trailing spaces', () => {
    const slug = generateSlug('  Test Company  ');
    expect(slug).toMatch(/^test-company-[a-z0-9]{6}$/);
  });

  it('should handle names with underscores', () => {
    const slug = generateSlug('Test_Company_Name');
    expect(slug).toMatch(/^test-company-name-[a-z0-9]{6}$/);
  });

  it('should handle names with multiple hyphens', () => {
    const slug = generateSlug('Test---Company');
    expect(slug).toMatch(/^test-company-[a-z0-9]{6}$/);
  });
});
