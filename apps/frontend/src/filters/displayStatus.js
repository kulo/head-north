export default function (status) {
    if (status == "todo") return "To Do"
    else if (status == "inprogress") return "In Progress"
    else if (status == "done") return "Done"
    else if (status == "postponed") return "Postponed"
    else if (status == "cancelled") return "Cancelled"
    else if (status == "replanned") return "Replanned"
    return "-"
}
