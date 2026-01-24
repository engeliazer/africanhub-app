
const Logo = () => {
    return (
        <div className="flex items-center justify-center" style={{ height: '100%' }}>
          <img 
            src="/ahubLogo.png" 
            alt="African Hub Logo" 
            className="logo-image rounded-lg"
            style={{
              maxHeight: '72px',
              maxWidth: '72px',
              height: 'auto',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
    );
};

export default Logo;