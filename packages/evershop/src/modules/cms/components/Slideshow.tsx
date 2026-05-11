import { Image } from '@components/common/Image.js';
import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur text-white transition-all hover:bg-white/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/60"
      onClick={onClick}
      aria-label="Anterior"
      type="button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  );
}

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur text-white transition-all hover:bg-white/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/60"
      onClick={onClick}
      aria-label="Siguiente"
      type="button"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  );
}

const SliderComponent = Slider as any;

interface SlideData {
  id: string;
  image: string;
  width?: number;
  height?: number;
  headline?: string;
  subText?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
}

interface SlideshowProps {
  slideshowWidget: {
    slides: SlideData[];
    autoplay?: boolean;
    autoplaySpeed?: number;
    arrows?: boolean;
    dots?: boolean;
  };
}

export default function Slideshow({
  slideshowWidget: {
    slides = [],
    autoplay = true,
    autoplaySpeed = 6000,
    arrows = true,
    dots = true
  }
}: SlideshowProps) {
  const settings = {
    dots: Boolean(dots),
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: Boolean(autoplay),
    autoplaySpeed: Number(autoplaySpeed) || 6000,
    arrows: Boolean(arrows),
    fade: false,
    pauseOnHover: true,
    adaptiveHeight: false,
    // Drag / swipe support
    draggable: true,
    swipe: true,
    swipeToSlide: true,
    touchMove: true,
    touchThreshold: 10,
    nextArrow: arrows ? <NextArrow /> : undefined,
    prevArrow: arrows ? <PrevArrow /> : undefined,
    customPaging: () => (
      <button
        type="button"
        aria-label="Ir al slide"
        className="anroy-dot mx-1 h-2 w-2 rounded-full bg-white/50 transition-all"
      />
    ),
    appendDots: (dotsNode: React.ReactNode) => (
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <ul className="flex gap-1 pointer-events-auto m-0 p-0">{dotsNode}</ul>
      </div>
    ),
    dotsClass: 'anroy-slideshow-dots'
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <style>{`
        .anroy-slideshow-dots { padding: 0; margin: 0; list-style: none; display: flex; gap: 4px; }
        .anroy-slideshow-dots li { display: inline-block; }
        .anroy-slideshow-dots li.slick-active .anroy-dot { background-color: #fff; width: 24px; }
        /* Hide default slick arrows in case of style conflict */
        .anroy-slideshow .slick-arrow { background: transparent; }
        .anroy-slideshow .slick-arrow:before { display: none; }
        .anroy-slideshow .slick-list, .anroy-slideshow .slick-track { display: flex; }
        .anroy-slideshow .slick-slide { height: inherit; }
        .anroy-slideshow .slick-slide > div { height: 100%; }
        /* Drag cursor — feels swipeable */
        .anroy-slideshow .slick-list { cursor: grab; }
        .anroy-slideshow .slick-list:active { cursor: grabbing; }
        /* Prevent text/image selection while dragging */
        .anroy-slideshow .slick-slide a,
        .anroy-slideshow .slick-slide img { user-select: none; -webkit-user-drag: none; }
      `}</style>

      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="anroy-slideshow relative rounded-2xl overflow-hidden shadow-xl bg-gray-100">
          <SliderComponent {...settings}>
            {slides.map((slide) => (
              <div key={slide.id} className="!block relative">
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] min-h-72 md:min-h-96 max-h-[520px] overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.headline || 'Slide'}
                    width={slide.width || 1920}
                    height={slide.height || 0}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    sizes="100vw"
                    priority
                  />

                  {/* Dark gradient overlay for text legibility — bottom-left bias */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/35 to-transparent pointer-events-none" />

                  {/* Content block — bottom-left aligned, editorial */}
                  {(slide.headline || slide.subText || (slide.buttonText && slide.buttonLink)) && (
                    <div className="absolute inset-0 flex items-end md:items-center">
                      <div className="px-6 md:px-12 lg:px-16 py-8 md:py-10 max-w-2xl">
                        {slide.headline && (
                          <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-lg mb-3 md:mb-4">
                            {slide.headline}
                          </h2>
                        )}

                        {slide.subText && (
                          <p className="text-white/95 text-base md:text-lg lg:text-xl leading-relaxed drop-shadow mb-6 md:mb-8 max-w-xl">
                            {slide.subText}
                          </p>
                        )}

                        {slide.buttonText && slide.buttonLink && (
                          <a
                            href={slide.buttonLink}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm md:text-base shadow-lg transition-all hover:scale-[1.04] hover:shadow-xl"
                            style={{
                              backgroundColor: slide.buttonColor || '#FFFFFF',
                              color: slide.buttonColor && slide.buttonColor.toLowerCase() !== '#ffffff' ? '#FFFFFF' : '#E11D48'
                            }}
                          >
                            {slide.buttonText}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </SliderComponent>
        </div>
      </div>
    </section>
  );
}

export const query = `
  query Query($slides: [SlideInput], $autoplay: Boolean, $autoplaySpeed: Int, $arrows: Boolean, $dots: Boolean) {
    slideshowWidget(
      slides: $slides,
      autoplay: $autoplay,
      autoplaySpeed: $autoplaySpeed,
      arrows: $arrows,
      dots: $dots
    ) {
      slides {
        id
        image
        width
        height
        headline
        subText
        buttonText
        buttonLink
        buttonColor
      }
      autoplay
      autoplaySpeed
      arrows
      dots
    }
  }
`;

export const fragments = `
  fragment SlideData on Slide {
    id
    image
    width
    height
    headline
    subText
    buttonText
    buttonLink
    buttonColor
  }
`;

export const variables = `{
  slides: getWidgetSetting("slides"),
  autoplay: getWidgetSetting("autoplay"),
  autoplaySpeed: getWidgetSetting("autoplaySpeed"),
  arrows: getWidgetSetting("arrows"),
  dots: getWidgetSetting("dots")
}`;
