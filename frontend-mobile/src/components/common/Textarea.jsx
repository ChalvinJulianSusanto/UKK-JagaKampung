const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  showCount = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-all duration-200 resize-none
          ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-gray-300 focus:border-primary focus:ring-primary/20'}
          focus:outline-none focus:ring-4
          disabled:bg-gray-100 disabled:cursor-not-allowed
          text-base
        `}
        {...props}
      />

      <div className="flex items-center justify-between mt-1.5">
        <div className="flex-1">
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        {showCount && maxLength && (
          <p className="text-sm text-gray-500">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default Textarea;
