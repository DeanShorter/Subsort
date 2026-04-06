'use client';

import Link from 'next/link';
import { trackEvent } from '../../../lib/track';

const CATEGORY_KEYWORDS = {
  Music: 'Production, performance, analysis, composition, gear reviews, covers',
  Sports: 'Football, basketball, combat sports, fitness, analysis, highlights',
  Entertainment: 'Comedy, commentary, drama, reaction, pop culture, creators',
  Lifestyle: 'Fashion, travel, home, wellness, self-improvement, vlogs',
  Technology: 'Gadgets, programming, AI, reviews, tutorials, startups',
  'Science & Education': 'Physics, biology, history, mathematics, explainers, research',
  'News & Politics': 'Current events, journalism, policy, debate, geopolitics, media',
  Gaming: 'Gameplay, reviews, esports, retro, strategy, walkthroughs',
  Food: 'Cooking, recipes, reviews, baking, street food, kitchen gear',
};

const CATEGORY_CLASSES = {
  Music: 'cat-music',
  Sports: 'cat-sports',
  Entertainment: 'cat-entertainment',
  Lifestyle: 'cat-lifestyle',
  Technology: 'cat-technology',
  'Science & Education': 'cat-science',
  'News & Politics': 'cat-news',
  Gaming: 'cat-gaming',
  Food: 'cat-food',
};

export function CategoryGridClient({ categories }) {
  return (
    <div className="dsc-section">
      <div className="dsc-section-header">
        <div>
          <div className="dsc-section-title">Browse by category</div>
        </div>
      </div>
      <div className="category-grid">
        {categories.map(cat => {
          const cls = CATEGORY_CLASSES[cat.name] || 'cat-music';
          const keywords = CATEGORY_KEYWORDS[cat.name] || '';
          return (
            <Link
              key={cat.name}
              href={`/discover/category/${encodeURIComponent(cat.name)}`}
              className={`category-card ${cls}`}
              onClick={() => trackEvent('category_browsed', { category_name: cat.name })}
            >
              <span className="category-card-count">{cat.count} channels</span>
              <div className="category-card-content">
                <div className="category-card-name">{cat.name}</div>
                {keywords && <div className="category-card-keywords">{keywords}</div>}
                <span className="category-card-browse">Browse &rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
