import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { Story } from '../../types/story';
import {
  getLocalizedStoryCategory,
  getLocalizedStoryDescription,
  getLocalizedStoryTitle,
} from '../../utils/catalogFilter';
import { formatTND } from '../../utils/pricing';
import { ResilientImage } from '../common/ResilientImage';

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const { lang, t } = useLanguage();
  const title = getLocalizedStoryTitle(story, lang);
  const description = getLocalizedStoryDescription(story, lang);
  const category = getLocalizedStoryCategory(story, lang);

  return (
    <article
      data-testid={`story-card-${story.id}`}
      className="group bg-white rounded-2xl border border-[#EADFD7] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <Link
        to={`/stories/${story.id}`}
        className="block aspect-[3/4] w-full bg-[#F8E8DC] overflow-hidden"
      >
        <ResilientImage
          src={story.coverImage}
          alt={title}
          fallbackTitle={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Unboxed metadata with typographic separators */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#706464]">
            <span>{category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {story.ageRange} {t.yearsUnit}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {story.pages} {t.pagesUnit}
            </span>
          </div>

          <h3 className="text-lg font-bold text-[#443B3B] leading-snug">
            <Link to={`/stories/${story.id}`} className="hover:underline underline-offset-4">
              {title}
            </Link>
          </h3>

          <p className="text-sm text-[#706464] leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#EADFD7]/70 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-[#443B3B] tabular-nums">
            {formatTND(story.price, lang)}
          </span>
          <Link
            to={`/stories/${story.id}`}
            className="px-4 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors whitespace-nowrap shrink-0"
          >
            {t.detailsBtn}
          </Link>
        </div>
      </div>
    </article>
  );
}
