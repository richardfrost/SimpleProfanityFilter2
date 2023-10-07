/* eslint-disable no-console */
import AdmZip from 'adm-zip';
import { removeFiles } from './lib.mjs';

// Required for Firefox due to bundled code
export default class PackageSource {
  constructor() {
    this.zip = new AdmZip();
  }

  addBinFiles() {
    for (const file of this.binFiles) { this.zip.addLocalFile(file, 'bin/'); }
  }

  addFiles() {
    this.addBinFiles();
    this.addRootFiles();
    this.addSourceFiles();
  }

  addRootFiles() {
    for (const file of this.rootFiles) { this.zip.addLocalFile(file); }
  }

  addSourceFiles() {
    this.zip.addLocalFolder('./src', 'src');
  }

  get binFiles() {
    return [
      'bin/clean.mjs',
      'bin/copy-static.mjs',
      'bin/lib.mjs',
      'bin/packageExtension.mjs',
      'bin/packageExtensionClass.mjs',
      'bin/postbuild.mjs',
      'bin/postbuildClass.mjs',
      'bin/prebuild.mjs',
      'bin/prebuildClass.mjs',
      'bin/webpack.bookmarklet.js',
      'bin/webpack.common.js',
      'bin/webpack.dev.js',
      'bin/webpack.prod.js',
    ];
  }

  get filePath() {
    return './release/source.zip';
  }

  get rootFiles() {
    return [
      '.build.json',
      'README.md',
      'LICENSE',
      'package-lock.json',
      'package.json',
      'tsconfig.json',
    ];
  }

  run() {
    removeFiles(this.filePath, true);
    this.showInstructions();
    this.addFiles();
    this.zip.writeZip(this.filePath);
  }

  showInstructions() {
    console.log(`Building ${this.filePath}`);
    console.log('Build from source: npm install && npm run package:bookmarklet && npm run package:firefox');
    console.log('  Unpacked: ./dist');
    console.log(`  Packed: ${this.filePath}`);
  }
}
