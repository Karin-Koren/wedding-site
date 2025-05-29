
function Navigation() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* <Link to="/" className="flex items-center px-2 py-2 text-gray-900 hover:text-primary-500">
              💍 Wedding Photos
            </Link> */}
          </div>
          <div className="flex space-x-4">
            {/* <Link to="/upload" className="px-3 py-2 text-gray-700 hover:text-primary-500">
              Upload
            </Link>
            <Link to="/gallery" className="px-3 py-2 text-gray-700 hover:text-primary-500">
              Gallery
            </Link> */}
            {/* <Link to="/guestbook" className="px-3 py-2 text-gray-700 hover:text-primary-500">
              Guestbook
            </Link> */}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation; 