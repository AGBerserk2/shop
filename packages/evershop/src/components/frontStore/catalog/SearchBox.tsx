import { Image } from '@components/common/Image.js';
import { Input } from '@components/common/ui/Input.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@components/common/ui/InputGroup.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Search, X } from 'lucide-react';
import React, { useRef, useState, ReactNode, useCallback } from 'react';
import { useClient } from 'urql';

const SEARCH_PRODUCTS_QUERY = `
  query Query($filters: [FilterInput]) {
    products(filters: $filters) {
      items {
        ...Product
      }
    }
  }
`;

const PRODUCT_FRAGMENT = `
  fragment Product on Product {
    productId
    name
    sku
    price {
      regular {
        value
        text
      }
      special {
        value
        text
      }
    }
    image {
      url
      alt
    }
    url
    inventory {
      isInStock
    }
  }
`;

export interface SearchResult {
  id: string;
  title: string;
  url?: string;
  image?: string;
  price?: string;
  type?: 'product' | 'category' | 'page';
  [key: string]: unknown;
}

interface SearchBoxProps {
  searchPageUrl: string;
  enableAutocomplete?: boolean;
  autocompleteDelay?: number;
  minSearchLength?: number;
  maxResults?: number;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  renderSearchInput?: (props: {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
    placeholder: string;
    ref: React.RefObject<HTMLInputElement | null>;
  }) => ReactNode;
  renderSearchResults?: (props: {
    results: SearchResult[];
    query: string;
    onSelect: (result: SearchResult) => void;
    isLoading: boolean;
  }) => ReactNode;
  renderSearchIcon?: () => ReactNode;
  renderCloseIcon?: () => ReactNode;
}
export function SearchBox({
  searchPageUrl,
  enableAutocomplete = false,
  autocompleteDelay = 300,
  minSearchLength = 2,
  maxResults = 10,
  onSearch,
  renderSearchInput,
  renderSearchResults,
  renderSearchIcon,
  renderCloseIcon
}: SearchBoxProps) {
  const InputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const client = useClient();

  const [keyword, setKeyword] = useState<string>('');
  const [showing, setShowing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const defaultSearchFunction = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      try {
        const result = await client
          .query(
            `
            ${PRODUCT_FRAGMENT}
            ${SEARCH_PRODUCTS_QUERY}
          `,
            {
              filters: [
                {
                  key: 'keyword',
                  operation: 'eq',
                  value: query
                },
                {
                  key: 'limit',
                  operation: 'eq',
                  value: `${maxResults}`
                }
              ]
            }
          )
          .toPromise();

        if (result.error) {
          return [];
        }

        if (!result.data?.products?.items) {
          return [];
        }

        return result.data.products.items.map((product: any) => ({
          id: product.productId,
          title: product.name,
          url: product.url,
          image: product.image?.url,
          price: product.price?.special?.text || product.price?.regular?.text,
          type: 'product' as const,
          sku: product.sku,
          isInStock: product.inventory?.isInStock
        }));
      } catch (error) {
        return [];
      }
    },
    [client]
  );

  const searchFunction = onSearch || defaultSearchFunction;

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('keyword');
    setKeyword(key || '');
  }, []);

  React.useEffect(() => {
    if (showing) {
      InputRef.current?.focus();
    }
  }, [showing]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!enableAutocomplete || query.length < minSearchLength) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchFunction(query);
        setSearchResults(results.slice(0, maxResults));
        setShowResults(true);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [enableAutocomplete, searchFunction, minSearchLength, maxResults]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setKeyword(value);

      if (enableAutocomplete) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
          performSearch(value);
        }, autocompleteDelay);
      }
    },
    [enableAutocomplete, autocompleteDelay, performSearch]
  );

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      if (result.url) {
        window.location.href = result.url;
      } else {
        const url = new URL(searchPageUrl, window.location.origin);
        url.searchParams.set('keyword', result.title);
        window.location.href = url.toString();
      }
      setShowing(false);
      setShowResults(false);
    },
    [searchPageUrl]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        setShowResults(false);
        const url = new URL(searchPageUrl, window.location.origin);
        url.searchParams.set('keyword', keyword);
        window.location.href = url.toString();
      } else if (event.key === 'Escape') {
        setShowResults(false);
        setShowing(false);
      }
    },
    [searchPageUrl, keyword]
  );

  const handleFocus = useCallback(() => {
    if (
      enableAutocomplete &&
      keyword.length >= minSearchLength &&
      searchResults.length > 0
    ) {
      setShowResults(true);
    }
  }, [enableAutocomplete, keyword, minSearchLength, searchResults.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowResults(false);
    }, 150);
  }, []);

  // Close the bar when clicking outside it (but not when interacting with
  // the results, which live inside).
  const containerRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!showing) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowing(false);
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showing]);

  return (
    <div className="search__box relative" ref={containerRef}>
      {/* Expanding bar — width animates from 0 to full when opened. The icon
          on the right toggles between Search and X. */}
      <div
        className={`flex items-center bg-white rounded-full transition-all duration-300 ease-out overflow-hidden ${
          showing
            ? 'w-[min(72vw,360px)] ring-1 ring-gray-200 shadow-sm pl-3 pr-1'
            : 'w-10'
        }`}
      >
        {/* Animated input wrapper — only takes space when open */}
        <div
          className={`transition-all duration-300 ease-out ${
            showing ? 'flex-1 opacity-100 ml-1' : 'w-0 opacity-0 ml-0 pointer-events-none'
          }`}
          aria-hidden={!showing}
        >
          {renderSearchInput
            ? renderSearchInput({
                value: keyword || '',
                onChange: handleInputChange,
                onKeyDown: handleKeyDown,
                onFocus: handleFocus,
                onBlur: handleBlur,
                placeholder: _('Buscar productos...'),
                ref: InputRef
              })
            : (
              <input
                ref={InputRef}
                type="text"
                placeholder={_('Buscar productos...')}
                value={keyword || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                enterKeyHint="search"
                className="w-full bg-transparent outline-none text-sm py-2 placeholder:text-gray-400"
                tabIndex={showing ? 0 : -1}
              />
            )}
        </div>

        {/* Toggle: search ↔ close. Same rounded circular button. */}
        <button
          type="button"
          className="search__icon shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          aria-label={showing ? 'Cerrar búsqueda' : 'Buscar'}
          onClick={() => {
            if (showing) {
              setShowing(false);
              setShowResults(false);
              setKeyword('');
            } else {
              setShowing(true);
            }
          }}
        >
          <span className={`absolute transition-all duration-200 ${showing ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
            <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </span>
          <span className={`absolute transition-all duration-200 ${showing ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
            <X className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </span>
        </button>
      </div>

      {/* Autocomplete results dropdown — anchored to the expanded bar */}
      {showing && enableAutocomplete && showResults && (
        <div className="absolute top-full right-0 mt-2 w-[min(80vw,420px)] z-50">
          {renderSearchResults
            ? renderSearchResults({
                results: searchResults,
                query: keyword || '',
                onSelect: handleResultSelect,
                isLoading: isSearching
              })
            : defaultSearchResults({
                results: searchResults,
                query: keyword || '',
                onSelect: handleResultSelect,
                isLoading: isSearching
              })}
        </div>
      )}
    </div>
  );
}

const defaultSearchInput = (props: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  ref: React.RefObject<HTMLInputElement | null>;
}) => (
  <div className="form__field flex items-center justify-center relative grow">
    <InputGroup>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        ref={props.ref}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={props.onKeyDown}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        enterKeyHint="done"
        className="w-full focus:outline-none"
      />
    </InputGroup>
  </div>
);

const defaultSearchResults = (props: {
  results: SearchResult[];
  query: string;
  onSelect: (result: SearchResult) => void;
  isLoading: boolean;
}) => {
  return (
    <div className="search__results bg-white border border-gray-100 rounded-xl shadow-xl max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
      {props.isLoading && (
        <div className="p-4 text-center text-gray-500 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-rose-300 border-t-rose-600 animate-spin" />
            Buscando…
          </span>
        </div>
      )}
      {!props.isLoading && props.results.length === 0 && props.query.length > 0 && (
        <div className="p-6 text-center text-gray-500 text-sm">
          <div className="text-3xl mb-1">🔍</div>
          <div>No encontramos resultados para</div>
          <div className="font-semibold text-gray-700 mt-0.5">&ldquo;{props.query}&rdquo;</div>
        </div>
      )}
      {!props.isLoading &&
        props.results.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-3 p-3 hover:bg-rose-50/60 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              props.onSelect(result);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onSelect(result);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {result.image ? (
              <Image
                src={result.image}
                alt={result.title}
                width={100}
                height={100}
                className="w-11 h-11 object-cover rounded-md shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                📦
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">
                {result.title}
              </div>
              {result.price && (
                <div className="text-sm font-bold text-rose-600">{result.price}</div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};
