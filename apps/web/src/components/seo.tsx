import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title = 'ITSA - Information Technology Students Association',
  description = 'Official website of the Information Technology Students Association (ITSA). Discover events, workshops, hackathons, and connect with peers.',
  keywords = 'ITSA, IT, Students Association, Engineering, Tech, Events, Hackathon',
  image = '/og-image.jpg',
  url = 'https://itsa.college.edu',
  type = 'website',
}: SEOProps) {
  const fullTitle = title === 'ITSA - Information Technology Students Association' ? title : `${title} | ITSA`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
}
