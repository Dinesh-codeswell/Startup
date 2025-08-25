export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-between px-4 h-14">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your team dashboard...</p>
      </div>
    </div>
  )
}
