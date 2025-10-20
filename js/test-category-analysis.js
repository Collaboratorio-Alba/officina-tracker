/**
 * Test script for category analysis
 */

import('./category-analysis.js').then(module => {
  const CategoryAnalyzer = module.default;
  const analyzer = new CategoryAnalyzer();
  
  analyzer.runAnalysis().then(report => {
    console.log('✅ Category analysis completed successfully!');
  }).catch(error => {
    console.error('❌ Category analysis failed:', error);
  });
}).catch(error => {
  console.error('❌ Failed to import category analyzer:', error);
});