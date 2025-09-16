
const fs = require('fs');
const path = require('path');

function findJsonFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir);
    for (const it of items) {
        const p = path.join(dir, it);
        if (fs.statSync(p).isDirectory()) {
            files.push(...findJsonFiles(p));
        } else if (p.endsWith('.json')) {
            files.push(p);
        }
    }
    return files;
}

const resultsDir = path.join(process.cwd(), 'test-results');
const files = findJsonFiles(resultsDir);
if (files.length === 0) {
    console.log('No test result JSON files found in test-results/');
    process.exit(0); // no results to summarize
}

let totalTests = 0, totalFailed = 0, totalPassed = 0;
const details = [];

for (const f of files) {
    try {
        const j = JSON.parse(fs.readFileSync(f, 'utf8'));
        // Jest format fields
        const t = j.numTotalTests ?? (j.numTotalTestsExecuted ?? 0);
        const failed = j.numFailedTests ?? (j.numFailedTests ?? 0);
        const passed = (t - failed);
        totalTests += t;
        totalFailed += failed;
        totalPassed += passed;
        details.push({ file: path.relative(process.cwd(), f), total: t, failed, passed });
    } catch (e) {
        console.warn('Skipping invalid JSON', f);
    }
}

const summary = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    totalTests,
    totalPassed,
    totalFailed,
    details
};

const outDir = path.join(process.cwd(), 'test-results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('Summary written to test-results/summary.json');
console.log(JSON.stringify(summary, null, 2,));

// baseline check
const baselineFile = path.join(process.cwd(), 'baseline.json');
if (fs.existsSync(baselineFile)) {
    try {
        const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
        const baselineTotal = baseline.baseline_total_tests ?? null;
        if (typeof baselineTotal === 'number') {
            console.log('Baseline total tests:', baselineTotal);
            if (totalTests < baselineTotal) {
                console.error(`FAIL: total tests decreased: ${totalTests} < baseline ${baselineTotal}`);
                process.exit(1);
            } else {
                console.log('Baseline check passed.');
            }
        } else {
            console.log('Baseline file present but baseline_total_tests not set.');
        }
    } catch (e) {
        console.warn('Could not read baseline.json:', e.message);
    }
} else {
    console.log('No baseline.json present — skipping baseline check.');
}
