using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GlobeRender : MonoBehaviour {

    List<Point> points;
    bool updateQueued;

	// Use this for initialization
	void Start () {
        points = new List<Point>();
        updateQueued = true;
	}
	
	// Update is called once per frame
	void Update () {
        //render pointerinos

        updateQueued = false;
	}

    public void AddPoint(Point newPoint)
    {
        points.Add(newPoint);
        updateQueued = true;
    }

    public void ClearPoints()
    {
        points.Clear();
        updateQueued = true;
    }

    public void AddPoints(List<Point> newPoints)
    {
        points.AddRange(newPoints);
        updateQueued = true;
    }
    
}

public class Point
{
    public Vector2 Position { get; set; }
    public Color Color { get; set; }
    public float Radius { get; set; }

    public Point()
    {
        Position = new Vector2();
        Color = new Color();
        Radius = 0.01f;
    }

    public Point(Vector2 position, Color color, float radius)
    {
        Position = position;
        Color = color;
        Radius = radius;
    }
}