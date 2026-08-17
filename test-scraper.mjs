import { scrapeMLAffiliateProfile, closeBrowser } from './server/services/mlScraper.ts';

try {
  console.log('Iniciando scraper...');
  const products = await scrapeMLAffiliateProfile('https://www.mercadolivre.com.br/social/flaviasts');
  console.log(`✓ Produtos encontrados: ${products.length}`);
  if (products.length > 0) {
    console.log('\nPrimeiros 2 produtos:');
    console.log(JSON.stringify(products.slice(0, 2), null, 2));
  }
  await closeBrowser();
} catch (error) {
  console.error('Erro ao scraper:', error);
  process.exit(1);
}
