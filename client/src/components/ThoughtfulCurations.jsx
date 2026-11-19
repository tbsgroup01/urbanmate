
import React, { useRef } from "react";

const services = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600",
        subtitle: "Full-home",
        title: "CLEANING",
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600",
        subtitle: "Washing Machine",
        title: "Jet Service",
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600",
        subtitle: "Roll-on",
        title: "WAXING",
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600",
        subtitle: "Men's",
        title: "GROOMING",
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600",
        subtitle: "SPA for",
        title: "WOMEN",
    },
    {
        id: 6,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600",
        subtitle: "Home",
        title: "INTERIOR",
    },
];

const ThoughtfulCurations = () => {
    const sliderRef = useRef(null);

    const scroll = (direction) => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({
                left: direction === "next" ? 270 : -270,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className="w-full bg-white py-8">
            <div className="mx-auto w-full px-6 md:px-8">

                {/* Heading */}
                <div className="mb-6">
                    <h2 className="text-3xl md:text-[36px] font-medium tracking-tight text-[#171717]">
                        Thoughtful curations
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        of our finest experiences
                    </p>
                </div>

                {/* Slider */}
                <div className="relative">

                    {/* Previous Button */}
                    <button
                        onClick={() => scroll("prev")}
                        aria-label="Previous services"
                        className="absolute -left-6 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>

                    {/* Cards Container */}
                    <div
                        ref={sliderRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
                    >
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="group relative h-[350px] min-w-[210px] flex-shrink-0 cursor-pointer overflow-hidden rounded-xl sm:h-[404px] sm:min-w-[227px]"
                            >
                                {/* Background Image */}
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />

                                {/* Play Button */}
                                <button
                                    aria-label={`Play ${service.title}`}
                                    onClick={() => console.log("Play:", service.title)}
                                    className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition duration-300 hover:scale-110 hover:bg-black/70"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </button>

                                {/* Bottom Content */}
                                <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                                    <p className="font-serif text-[27px] italic leading-tight">
                                        {service.subtitle}
                                    </p>

                                    <h3 className="text-[27px] font-medium leading-tight tracking-wide">
                                        {service.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => scroll("next")}
                        aria-label="Next services"
                        className="absolute -right-6 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                </div>
            </div>
        </section>
    );
};

export default ThoughtfulCurations;
