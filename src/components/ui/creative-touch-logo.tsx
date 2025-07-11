interface LogoProps {
  className?: string;
  size?: number;
}

const CreativeTouchLogo = ({ className, size = 40 }: LogoProps) => {
  return (
    <div className={`relative ${className}`} style={{ width: size * 2, height: size }}>
      {/* الخلفية الدائرية */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl shadow-lg"
        style={{ transform: 'rotate(-3deg)' }}
      />
      <div 
        className="absolute inset-0 bg-gradient-to-tl from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-80"
        style={{ transform: 'rotate(3deg)' }}
      />
      
      {/* المحتوى */}
      <div className="relative z-10 h-full flex items-center justify-center bg-white rounded-xl mx-1 my-1 shadow-inner">
        <div className="text-center">
          {/* مقص منمق */}
          <div className="relative mb-1">
            <svg 
              width={size * 0.6} 
              height={size * 0.6} 
              viewBox="0 0 24 24" 
              className="mx-auto text-gray-700"
              fill="currentColor"
            >
              <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z"/>
            </svg>
          </div>
          
          {/* النص */}
          <div className="text-xs font-bold text-gray-800 leading-tight">
            <div className="text-orange-600">لمسة</div>
            <div className="text-purple-600">إبداعية</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeTouchLogo;
