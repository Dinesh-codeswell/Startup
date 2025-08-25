import { Calendar, User, ChevronRight } from "lucide-react"

interface TasksPreviewWidgetProps {
  upcomingTasks: any[]
  members: any[]
}

export default function TasksPreviewWidget({ upcomingTasks, members }: TasksPreviewWidgetProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Not Started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.id === userId)
    return member?.name || "Unknown"
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
          <span>View All</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User size={12} />
                  <span>{task.assignees?.map((id: string) => getMemberName(id)).join(", ")}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No upcoming tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}
