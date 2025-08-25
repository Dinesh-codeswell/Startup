"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Plus, MoreHorizontal, X, Edit, Trash2, ChevronDown } from "lucide-react"

interface TasksScreenProps {
  teamData: any
  currentUser: any
  onRouteChange: (route: string) => void
}

export default function TasksScreen({ teamData, currentUser, onRouteChange }: TasksScreenProps) {
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignees: [],
  })

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Market Research Analysis",
      description:
        "Conduct comprehensive market research to analyze current trends, competitor strategies, and identify potential opportunities for our upcoming product launch.",
      assignees: ["Marcus Johnson", "David Kim"],
      status: "In Progress",
      priority: "High",
      dueDate: "12/20/2024",
    },
    {
      id: 2,
      title: "Design Mockups",
      description:
        "Create detailed design mockups for the new user interface, including wireframes, color schemes, and interactive prototypes for user testing.",
      assignees: ["Elena Rodriguez"],
      status: "Pending",
      priority: "Medium",
      dueDate: "12/18/2024",
    },
    {
      id: 3,
      title: "Strategy Presentation",
      description:
        "Prepare and deliver a comprehensive strategy presentation to stakeholders outlining our Q1 objectives and implementation roadmap.",
      assignees: ["Sarah Chen"],
      status: "Not Started",
      priority: "High",
      dueDate: "12/25/2024",
    },
  ])

  const teamMembers = [
    { id: 1, name: "Sarah Chen", avatar: "/placeholder.svg?height=32&width=32" },
    { id: 2, name: "Marcus Johnson", avatar: "/placeholder.svg?height=32&width=32" },
    { id: 3, name: "Elena Rodriguez", avatar: "/placeholder.svg?height=32&width=32" },
    { id: 4, name: "David Kim", avatar: "/placeholder.svg?height=32&width=32" },
  ]

  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openStatusDropdown !== null) {
        const currentDropdownRef = dropdownRefs.current[openStatusDropdown]
        if (currentDropdownRef && !currentDropdownRef.contains(event.target as Node)) {
          setOpenStatusDropdown(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openStatusDropdown])

  const handleCreateTask = () => {
    setShowCreateTaskModal(true)
  }

  const handleAssigneeToggle = (memberId: number) => {
    setNewTask((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }))
  }

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.title.trim()) {
      const assigneeNames = newTask.assignees
        .map((id) => teamMembers.find((member) => member.id === id)?.name)
        .filter(Boolean)

      const newTaskItem = {
        id: tasks.length + 1,
        title: newTask.title,
        description: newTask.description,
        assignees: assigneeNames,
        status: "Not Started",
        priority: newTask.priority,
        dueDate: newTask.dueDate || "No due date",
      }

      setTasks((prev) => [...prev, newTaskItem])
    }

    setShowCreateTaskModal(false)
    setNewTask({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
      assignees: [],
    })
  }

  const handleStatusChange = (taskId: number, newStatus: string) => {
    console.log("[v0] Updating task", taskId, "to status", newStatus) // Add debug logging
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    setOpenStatusDropdown(null)
  }

  const handleViewTaskDetails = (task) => {
    setSelectedTask(task)
    setShowTaskDetailsModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask({
      ...task,
      assignees: task.assignees
        .map((name) => teamMembers.find((member) => member.name === name)?.id || 0)
        .filter((id) => id !== 0),
    })
    setShowEditTaskModal(true)
  }

  const handleDeleteTask = (task) => {
    setTaskToDelete(task)
    setShowDeleteConfirmModal(true)
  }

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTask && editingTask.title.trim()) {
      const assigneeNames = editingTask.assignees
        .map((id) => teamMembers.find((member) => member.id === id)?.name)
        .filter(Boolean)

      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                title: editingTask.title,
                description: editingTask.description,
                assignees: assigneeNames,
                priority: editingTask.priority,
                dueDate: editingTask.dueDate,
              }
            : task,
        ),
      )
    }

    setShowEditTaskModal(false)
    setEditingTask(null)
  }

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id))
    }
    setShowDeleteConfirmModal(false)
    setTaskToDelete(null)
  }

  const handleEditAssigneeToggle = (memberId: number) => {
    setEditingTask((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Not Started":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "To Do":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500"
      case "Pending":
        return "bg-yellow-500"
      case "Not Started":
        return "bg-gray-500"
      case "Completed":
        return "bg-green-500"
      case "To Do":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const toggleStatusDropdown = (taskId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setOpenStatusDropdown(openStatusDropdown === taskId ? null : taskId)
  }

  const handleTaskCardClick = (task) => {
    handleViewTaskDetails(task)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 px-0 py-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>

            <div className="flex items-center space-x-3">
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Tasks</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={handleCreateTask}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTaskCardClick(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditTask(task)
                      }}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                      title="Edit task"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(task)
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Assigned to: {task.assignees.join(", ")}</p>
                  <div className="flex items-center space-x-3">
                    <div className="relative" ref={(el) => (dropdownRefs.current[task.id] = el)}>
                      <button
                        onClick={(e) => toggleStatusDropdown(task.id, e)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity flex items-center space-x-1 ${getStatusColor(task.status)}`}
                      >
                        <ChevronDown size={12} />
                        <span>{task.status}</span>
                      </button>
                      {openStatusDropdown === task.id && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Change Status
                            </div>
                            {["To Do", "In Progress", "Pending", "Completed", "Not Started"].map((status) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log("[v0] Status button clicked:", status, "for task", task.id) // Add debug logging
                                  handleStatusChange(task.id, status)
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                  task.status === status ? "bg-blue-50 text-blue-700" : "text-gray-700"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`}></span>
                                <span>{status}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Due: {task.dueDate}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewTaskDetails(task)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="View task details"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCreateTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Create New Task</h3>
                  <button
                    onClick={() => setShowCreateTaskModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitTask} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                      placeholder="Enter task title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
                      placeholder="Enter task description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                        className="w-full h-[48px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full h-[48px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Assign To</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {teamMembers.map((member) => {
                        const avatarText = member.name.charAt(0)
                        return (
                          <label
                            key={member.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={newTask.assignees.includes(member.id)}
                              onChange={() => handleAssigneeToggle(member.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <img
                              src={member.avatar || `/placeholder.svg?height=32&width=32&text=${avatarText}`}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-sm font-medium text-gray-900">{member.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateTaskModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditTaskModal && editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Task</h3>
                  <button
                    onClick={() => setShowEditTaskModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdateTask} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                      placeholder="Enter task title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingTask.description || ""}
                      onChange={(e) => setEditingTask((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
                      placeholder="Enter task description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={editingTask.priority}
                        onChange={(e) => setEditingTask((prev) => ({ ...prev, priority: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={editingTask.dueDate}
                        onChange={(e) => setEditingTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Assign To</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {teamMembers.map((member) => {
                        const avatarText = member.name.charAt(0)
                        return (
                          <label
                            key={member.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={editingTask.assignees.includes(member.id)}
                              onChange={() => handleEditAssigneeToggle(member.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <img
                              src={member.avatar || `/placeholder.svg?height=32&width=32&text=${avatarText}`}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="text-sm font-medium text-gray-900">{member.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditTaskModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Update Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmModal && taskToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                <button onClick={() => setShowDeleteConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showTaskDetailsModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                <button
                  onClick={() => setShowTaskDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Title</h4>
                  <p className="text-gray-900">{selectedTask.title}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedTask.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">{/* Additional details can be added here */}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
