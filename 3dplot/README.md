3D Scatter Plot Projection 

This project visualizes randomly generated 3D points on an HTML5 canvas. Users can rotate the point cloud using Yaw, Pitch, and Roll controls and switch between Orthographic and Perspective projection modes.

Workflow
1. Generate random 3D points (stored in data.json).
2. Load points into JavaScript.
3. Convert slider angles from degrees to radians.
4. Apply Pitch (X-axis), Yaw (Y-axis), and Roll (Z-axis) rotations.
5. Translate points slightly along Z.
6. Project 3D points to 2D.
7. Draw points on canvas.
8. Repeat using animation for auto-rotation.
   
Random Number Generation
Each point contains x, y, and z values randomly distributed within a fixed range (approximately -400 to +400), producing a 3D scatter cloud.

Rotation Formulas
Pitch (X): y'=y cosθ-z sinθ, z'=y sinθ+z cosθ
Yaw (Y): x'=x cosθ+z sinθ, z'=-x sinθ+z cosθ
Roll (Z): x'=x cosθ-y sinθ, y'=x sinθ+y cosθ

Degree to Radian
Radians = Degrees × π / 180. JavaScript Math.sin() and Math.cos() require radians.

Orthographic Projection
Ignores depth. Formula: x_screen=x, y_screen=y. Objects retain size regardless of distance.

Perspective Projection
Includes depth scaling. scale=f/(f+z); x_screen=x×scale; y_screen=y×scale. Distant objects appear smaller.

Overall Implementation
The browser loads the dataset, applies selected rotations every frame, converts the rotated 3D coordinates into 2D using the chosen projection, and renders the scatter plot on the canvas. When Auto Rotate is enabled, rotation angles are continuously updated and the scene is redrawn using requestAnimationFrame for smooth animation.



by -NAVEEN KUMAR G
