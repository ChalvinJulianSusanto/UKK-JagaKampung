const MaskedIcon = ({ src, color = '#FFFFFF', size = 20, alt = '' }) => {
    const style = {
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        maskPosition: 'center',
        display: 'inline-block',
        flex: '0 0 auto',
    };
    return <span role="img" aria-label={alt} style={style} />;
};

export default MaskedIcon;
