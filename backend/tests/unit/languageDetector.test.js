const { detectLanguage, detectFromExtension, detectFromShebang, detectFromContent } = require('../../src/utils/languageDetector');

describe('languageDetector', () => {
  describe('detectFromExtension', () => {
    it('should detect Python', () => expect(detectFromExtension('main.py')).toBe('python'));
    it('should detect JavaScript', () => expect(detectFromExtension('app.js')).toBe('javascript'));
    it('should detect TypeScript', () => expect(detectFromExtension('index.ts')).toBe('typescript'));
    it('should detect Go', () => expect(detectFromExtension('main.go')).toBe('go'));
    it('should detect Java', () => expect(detectFromExtension('Main.java')).toBe('java'));
    it('should detect Rust', () => expect(detectFromExtension('main.rs')).toBe('rust'));
    it('should detect C++', () => expect(detectFromExtension('prog.cpp')).toBe('cpp'));
    it('should detect Ruby', () => expect(detectFromExtension('script.rb')).toBe('ruby'));
    it('should return null for unknown extension', () => expect(detectFromExtension('data.xyz')).toBeNull());
    it('should return null for no extension', () => expect(detectFromExtension('Makefile')).toBeNull());
    it('should handle empty input', () => expect(detectFromExtension('')).toBeNull());
    it('should handle null', () => expect(detectFromExtension(null)).toBeNull());
  });

  describe('detectFromShebang', () => {
    it('should detect Python shebang', () => expect(detectFromShebang('#!/usr/bin/env python3\nprint("hi")')).toBe('python'));
    it('should detect Node shebang', () => expect(detectFromShebang('#!/usr/bin/env node\nconsole.log("hi")')).toBe('javascript'));
    it('should detect bash shebang', () => expect(detectFromShebang('#!/bin/bash\necho hi')).toBe('bash'));
    it('should return null for no shebang', () => expect(detectFromShebang('print("hi")')).toBeNull());
    it('should handle null', () => expect(detectFromShebang(null)).toBeNull());
  });

  describe('detectFromContent', () => {
    it('should detect Python from import', () => expect(detectFromContent('import os')).toBe('python'));
    it('should detect Python from def', () => expect(detectFromContent('def main():')).toBe('python'));
    it('should detect JS from const', () => expect(detectFromContent('const x = 1;')).toBe('javascript'));
    it('should detect Go from package', () => expect(detectFromContent('package main')).toBe('go'));
    it('should detect Java from public class', () => expect(detectFromContent('public class Main {')).toBe('java'));
    it('should detect Rust from fn main', () => expect(detectFromContent('fn main() {')).toBe('rust'));
    it('should detect C++ from #include', () => expect(detectFromContent('#include <iostream>')).toBe('cpp'));
    it('should return null for ambiguous content', () => expect(detectFromContent('x = 1')).toBeNull());
  });

  describe('detectLanguage (integrated)', () => {
    it('should prefer extension over content', () => {
      expect(detectLanguage('main.py', 'const x = 1;')).toBe('python');
    });

    it('should fallback to shebang when no extension', () => {
      expect(detectLanguage('script', '#!/usr/bin/env python3\nprint("hi")')).toBe('python');
    });

    it('should fallback to content heuristics', () => {
      expect(detectLanguage('', 'package main')).toBe('go');
    });

    it('should return plaintext as last resort', () => {
      expect(detectLanguage('', '')).toBe('plaintext');
    });
  });
});
