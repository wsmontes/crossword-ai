// Centralized notification management system
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.notificationId = 0;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notifications');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications';
            this.container.className = 'notifications';
            this.container.setAttribute('role', 'alert');
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 5000, options = {}) {
        if (!message) return null;

        const id = ++this.notificationId;
        const notification = this.createNotificationElement(id, message, type, options);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-remove after duration (unless persistent)
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    createNotificationElement(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;

        // Icon based on type
        const icon = this.getIcon(type);
        
        // Content
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        if (icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `fas ${icon}`;
            iconElement.setAttribute('aria-hidden', 'true');
            content.appendChild(iconElement);
        }

        const messageElement = document.createElement('span');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);

        notification.appendChild(content);

        // Close button (unless disabled)
        if (!options.noClose) {
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            closeButton.setAttribute('aria-label', 'Close notification');
            closeButton.addEventListener('click', () => this.remove(id));
            notification.appendChild(closeButton);
        }

        // Action button (if provided)
        if (options.action) {
            const actionButton = document.createElement('button');
            actionButton.className = 'notification-action';
            actionButton.textContent = options.action.text;
            actionButton.addEventListener('click', () => {
                options.action.callback();
                this.remove(id);
            });
            notification.appendChild(actionButton);
        }

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            loading: 'fa-spinner fa-spin'
        };
        return icons[type] || icons.info;
    }

    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.classList.add('removing');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    clear() {
        this.notifications.forEach((notification, id) => {
            this.remove(id);
        });
    }

    // Convenience methods
    success(message, duration = 4000, options = {}) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration = 8000, options = {}) {
        return this.show(message, 'error', duration, options);
    }

    warning(message, duration = 6000, options = {}) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration = 5000, options = {}) {
        return this.show(message, 'info', duration, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, { noClose: true, ...options });
    }

    // Update an existing notification
    update(id, message, type = null) {
        const notification = this.notifications.get(id);
        if (!notification) return false;

        const messageElement = notification.querySelector('.notification-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        if (type) {
            // Remove old type classes
            notification.className = notification.className.replace(/\b(success|error|warning|info|loading)\b/g, '');
            notification.classList.add(type);

            // Update icon
            const iconElement = notification.querySelector('.notification-content i');
            if (iconElement) {
                iconElement.className = `fas ${this.getIcon(type)}`;
            }
        }

        return true;
    }

    // Get count of active notifications
    getCount() {
        return this.notifications.size;
    }

    // Check if a specific type of notification exists
    hasType(type) {
        for (const notification of this.notifications.values()) {
            if (notification.classList.contains(type)) {
                return true;
            }
        }
        return false;
    }
}

// Create global instance
window.NotificationManager = NotificationManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notifications = new NotificationManager();
    });
} else {
    window.notifications = new NotificationManager();
} 