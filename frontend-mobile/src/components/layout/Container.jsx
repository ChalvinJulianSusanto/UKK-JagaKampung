const Container = ({ children, className = '', padding = true }) => {
  const paddingClass = padding ? 'px-4 py-4' : '';

  return (
    <div className={`w-full max-w-screen-lg mx-auto ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

export default Container;
