/**
 * Test for Ticket SEC-303: XSS Vulnerability
 * 
 * This test verifies that:
 * - HTML in transaction descriptions is properly escaped
 * - XSS attack vectors are prevented
 * - Script tags are rendered as text, not executed
 * - Event handlers are escaped
 * - Various XSS payloads are neutralized
 */

import { escapeHtml } from '../lib/security/escapeHtml';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('XSS Prevention (SEC-303)', () => {
  describe('HTML Escaping', () => {
    test('should escape HTML tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(malicious);
      
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
    });

    test('should escape ampersands', () => {
      const text = 'A & B';
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('A &amp; B');
      // The & is escaped to &amp;, so the original & is not present as a raw character
      expect(escaped).not.toMatch(/[^&]&[^a]|^&[^a]|[^p]&[^a]/); // No standalone & (not part of &amp;)
    });

    test('should escape less than and greater than', () => {
      const text = '<div>content</div>';
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('&lt;div&gt;content&lt;/div&gt;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });

    test('should escape double quotes', () => {
      const text = 'Text with "quotes"';
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('Text with &quot;quotes&quot;');
      expect(escaped).not.toContain('"');
    });

    test('should escape single quotes', () => {
      const text = "Text with 'quotes'";
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('Text with &#039;quotes&#039;');
    });

    test('should escape all HTML special characters together', () => {
      const text = '<div onclick="alert(\'XSS\')">&</div>';
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('&lt;div onclick=&quot;alert(&#039;XSS&#039;)&quot;&gt;&amp;&lt;/div&gt;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('"');
      expect(escaped).not.toContain("'");
    });
  });

  describe('XSS Attack Vectors', () => {
    test('should prevent script tag injection', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<script src="evil.js"></script>',
        '<script>document.cookie</script>',
        '<script>fetch("/api/steal")</script>',
      ];

      xssPayloads.forEach(payload => {
        const escaped = escapeHtml(payload);
        // HTML tags should be escaped, not present as actual tags
        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('</script>');
        // Should contain escaped versions
        expect(escaped).toContain('&lt;script');
        expect(escaped).toContain('&lt;/script&gt;');
      });
    });

    test('should prevent event handler injection', () => {
      const xssPayloads = [
        '<img src="x" onerror="alert(1)">',
        '<div onclick="alert(\'XSS\')">Click me</div>',
        '<body onload="evil()">',
        '<svg onload="alert(1)">',
      ];

      xssPayloads.forEach(payload => {
        const escaped = escapeHtml(payload);
        // HTML tags should be escaped, preventing event handlers from being active
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('<div');
        expect(escaped).not.toContain('<body');
        expect(escaped).not.toContain('<svg');
        expect(escaped).toContain('&lt;');
        expect(escaped).toContain('&gt;');
      });
    });

    test('should prevent iframe injection', () => {
      const xssPayload = '<iframe src="javascript:alert(1)"></iframe>';
      const escaped = escapeHtml(xssPayload);
      
      expect(escaped).not.toContain('<iframe');
      expect(escaped).toContain('&lt;iframe');
    });

    test('should prevent javascript: protocol injection', () => {
      const xssPayloads = [
        '<a href="javascript:alert(1)">Click</a>',
        '<img src="javascript:alert(1)">',
      ];

      xssPayloads.forEach(payload => {
        const escaped = escapeHtml(payload);
        // HTML tags should be escaped, preventing javascript: protocol from being active
        expect(escaped).not.toContain('<a');
        expect(escaped).not.toContain('<img');
        expect(escaped).toContain('&lt;');
        // The text "javascript:" may appear in escaped form, but tags are escaped so it's safe
      });
    });

    test('should prevent data URI injection', () => {
      const xssPayload = '<img src="data:text/html,<script>alert(1)</script>">';
      const escaped = escapeHtml(xssPayload);
      
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
    });

    test('should prevent style tag injection', () => {
      const xssPayload = '<style>body { display: none; }</style>';
      const escaped = escapeHtml(xssPayload);
      
      expect(escaped).not.toContain('<style>');
      expect(escaped).toContain('&lt;style&gt;');
    });

    test('should prevent link tag injection', () => {
      const xssPayload = '<link rel="stylesheet" href="evil.css">';
      const escaped = escapeHtml(xssPayload);
      
      expect(escaped).not.toContain('<link');
      expect(escaped).toContain('&lt;link');
    });
  });

  describe('Real-World XSS Scenarios', () => {
    test('should handle transaction description with HTML', () => {
      const maliciousDescription = 'Payment <script>stealCookies()</script> received';
      const escaped = escapeHtml(maliciousDescription);
      
      expect(escaped).toBe('Payment &lt;script&gt;stealCookies()&lt;/script&gt; received');
      expect(escaped).not.toContain('<script>');
    });

    test('should handle description with mixed content', () => {
      const description = 'Transfer from <b>John</b> & <i>Jane</i>';
      const escaped = escapeHtml(description);
      
      expect(escaped).toBe('Transfer from &lt;b&gt;John&lt;/b&gt; &amp; &lt;i&gt;Jane&lt;/i&gt;');
    });

    test('should preserve safe text content', () => {
      const safeText = 'Regular transaction description';
      const escaped = escapeHtml(safeText);
      
      expect(escaped).toBe(safeText);
    });

    test('should handle empty strings', () => {
      const escaped = escapeHtml('');
      expect(escaped).toBe('');
    });

    test('should handle strings with only special characters', () => {
      const text = '<>&"\'';
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('&lt;&gt;&amp;&quot;&#039;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });
  });

  describe('Edge Cases', () => {
    test('should handle nested HTML tags', () => {
      const nested = '<div><span><script>alert(1)</script></span></div>';
      const escaped = escapeHtml(nested);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    test('should handle HTML attributes', () => {
      const withAttributes = '<input type="text" value="test" onclick="evil()">';
      const escaped = escapeHtml(withAttributes);
      
      // HTML tag should be escaped, preventing onclick from being active
      expect(escaped).not.toContain('<input');
      expect(escaped).toContain('&lt;input');
    });

    test('should handle multiple occurrences of same character', () => {
      const text = '<<<script>>>';
      const escaped = escapeHtml(text);
      
      expect(escaped).toBe('&lt;&lt;&lt;script&gt;&gt;&gt;');
      expect(escaped.split('&lt;').length).toBe(4); // 3 < characters + 1 empty string
    });

    test('should handle unicode characters safely', () => {
      const text = 'Payment €100 <script>alert(1)</script>';
      const escaped = escapeHtml(text);
      
      expect(escaped).toContain('€100');
      expect(escaped).not.toContain('<script>');
    });
  });

  describe('Security Verification', () => {
    test('should ensure escaped text cannot execute JavaScript', () => {
      const xssPayload = '<script>window.location="http://evil.com"</script>';
      const escaped = escapeHtml(xssPayload);
      
      // The escaped text should be safe to render - HTML tags are escaped
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
      
      // Verify it's properly escaped
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;/script&gt;');
    });

    test('should prevent cookie theft attempts', () => {
      const xssPayload = '<img src="x" onerror="fetch(\'/steal?cookie=\'+document.cookie)">';
      const escaped = escapeHtml(xssPayload);
      
      // HTML tag should be escaped, preventing onerror from being active
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
    });

    test('should prevent DOM manipulation attempts', () => {
      const xssPayload = '<div><script>document.body.innerHTML="Hacked"</script></div>';
      const escaped = escapeHtml(xssPayload);
      
      // HTML tags should be escaped, preventing script execution
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
      expect(escaped).not.toContain('<div>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;/script&gt;');
    });
  });
});

