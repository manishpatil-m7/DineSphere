const ContactButton = () => (
  <button
    className="
      rounded-full
      px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4
      text-xs sm:text-sm md:text-base
      text-white font-medium uppercase tracking-widest
      cursor-pointer
      whitespace-nowrap
      overflow-visible
      flex-shrink-0
      transition-transform duration-200 hover:scale-105 active:scale-95
      outline outline-2 outline-white -outline-offset-[3px]
    "
    style={{
      background:
        'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
      boxShadow:
        '0px 4px 4px rgba(181, 1, 167, 0.25), 4px 4px 12px #7721B1 inset',
    }}
  >
    Book a Demo
  </button>
);

export default ContactButton;
