using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using Valve.VR;

public class VR_ColliderTeleporter : MonoBehaviour {

    //Max teleport range
    public InterpolationMode mode = InterpolationMode.Instant;
    [Range(0, 1)] public float tRate = 0.1f;
    [Range(0, 0.5f)] public float threshold = 0.05f;
    public int chargeTime = 90;
    public float maxDist = 5f;
    public GameObject shadowGO;

    //Max height allowed
    float upperBound = 24f;

    //Min distance from center allowed
    float innerBound = 10f;

    //Max distance from center allowed, mapped to respective Y values below
    float topOuterRadius = 13.5f;
    float midOuterRadius = 17f;
    float botOuterRadius = 15f;

    //Top, Middle and Bottom height values of Reactor's explorable area
    float topY = 24f;
    float midY = 18f;
    float botY = 12f;

    int charge = 0;
    float tProg = 0f;

    Vector3 tPos;
    Vector3 startPos;
    Transform t;
    Transform shadow { get { return shadowGO.transform; } }
    LineRenderer shadowLR;
    
    bool skipBoundCorrection = true;
    bool teleporting = false;
    bool postTeleport = false;
    bool enableTeleport = false;

    // Use this for initialization
    void Start () {
        var trackedController = GetComponent<SteamVR_TrackedController>();
        if (trackedController == null)
        {
            trackedController = gameObject.AddComponent<SteamVR_TrackedController>();
        }

        trackedController.TriggerClicked += new ClickedEventHandler(ProjectReference);
        trackedController.TriggerUnclicked += new ClickedEventHandler(Teleport);

        var top = SteamVR_Render.Top();
        if (top == null) Debug.LogError("Cannot Find Play Area!");

        t = top.origin;

        shadowLR = shadow.GetComponent<LineRenderer>();
    }
	
	// Update is called once per frame
	void Update () {
        //perform pre-teleport update
        if (shadowGO.activeSelf)
        {
            float t = charge / (float)chargeTime;
            shadow.position = BoundedTeleport();
            shadowLR.SetPositions(new Vector3[] { transform.position,  Vector3.Lerp(transform.position, shadow.position, t*t)});
            Debug.Log(charge);
            if(++charge == chargeTime)
            {
                Debug.Log("ding!");
                shadowLR.widthMultiplier = 0.2f;
                enableTeleport = true;
            }
        }

        if (teleporting && tPos != null)
        {
            tProg = Mathf.Clamp01(tProg + tRate);
            if (tProg >= 1.0f)
            {
                teleporting = false;
                postTeleport = true;
            }

            t.position = InterpolateTeleport(tProg);
        }

        //perform post-teleport update
        if (postTeleport)
        {
            tProg = 0f;
            postTeleport = false;
        }
    }

    // Project a shadow reference where teleport is aimed.
    void ProjectReference(object sender, ClickedEventArgs e)
    {
        shadowGO.SetActive(true);
    }

    // Teleport User to targeted location using colliders
    void Teleport(object sender, ClickedEventArgs e)
    {
        shadowGO.SetActive(false);
        shadowLR.SetPositions(new Vector3[] { Vector3.zero, Vector3.zero });
        shadowLR.widthMultiplier = 0.1f;
        charge = 0;


        if (enableTeleport)
        {
            enableTeleport = false;
            startPos = t.position;
            tPos = BoundedTeleport();
            teleporting = true;
        }
    }

    Vector3 InterpolateTeleport(float t)
    {
        Vector3 v = new Vector3();

        switch (mode) {
            case InterpolationMode.Instant:
                teleporting = false;
                postTeleport = true;
                return tPos;

            case InterpolationMode.SigmoidBoth:
                if (t < 0.5f)
                    return Vector3.Lerp(startPos, tPos, SigmoidInterpolation(t) * threshold);
                else if (t < 1.0f)
                    return Vector3.Lerp(startPos, tPos, SigmoidInterpolation(t) * threshold + 1 - threshold);
                else
                    return tPos;

            case InterpolationMode.SigmoidFinish:
                return Vector3.Lerp(startPos, tPos, SigmoidInterpolation(t) * threshold + 1 - threshold);

            case InterpolationMode.SigmoidStart:
                if (t < 1.0f)
                    return Vector3.Lerp(startPos, tPos,  SigmoidInterpolation(t) * threshold);
                else
                    return tPos;

            case InterpolationMode.SlowBoth:
                if (t < 0.5f)
                    return Vector3.Lerp(startPos, tPos, t * threshold);
                else if (t < 1.0f)
                    return Vector3.Lerp(startPos, tPos, t * threshold + 1 - threshold);
                else
                    return tPos;

            case InterpolationMode.SlowFinish:
                return Vector3.Lerp(startPos, tPos, t * threshold + 1 - threshold);

            case InterpolationMode.SlowStart:
                if (t < 1.0f)
                    return Vector3.Lerp(startPos, tPos, t * threshold);
                else
                    return tPos;
        }

        return v;
    }

    Vector3 BoundedTeleport()
    {
        // Create a Ray from the origin of the controller in the direction that the controller is pointing
        Ray ray = new Ray(this.transform.position, transform.forward);

        // Set defaults
        bool hasTarget = false;
        float dist = 0f;

        //raycast must ignore layer 8 (particles)
        int layerMask = ~(1 << 8);

        RaycastHit hitInfo;
        hasTarget = Physics.Raycast(ray, out hitInfo, maxDist, layerMask);
        dist = hitInfo.distance;

        if (!hasTarget) dist = maxDist;

        float y = t.position.y;
        // Get the current Camera (head) position on the ground relative to the world
        Vector3 headPosOnGround = new Vector3(SteamVR_Render.Top().head.position.x, y, SteamVR_Render.Top().head.position.z);

        // Calculate new position
        Vector3 newPos = t.position + (ray.origin + (ray.direction * dist)) - headPosOnGround;

        if (skipBoundCorrection) { return newPos; }

        //Correct for clipping with sides and top of reactor:

        //first move area down if above threshold height
        if (newPos.y > upperBound)
        {
            Debug.Log("Hit top: y=" + newPos.y);
            newPos.y = upperBound;
        }

        //calculate XY distance from each upper corner of play area to origin
        HmdQuad_t rect = new HmdQuad_t();
        SteamVR_PlayArea.GetBounds(SteamVR_PlayArea.Size.Calibrated, ref rect);

        var corners = new Vector3[]
        {
            t.position + new Vector3(rect.vCorners0.v0, rect.vCorners0.v1,rect.vCorners0.v2),
            t.position + new Vector3(rect.vCorners1.v0, rect.vCorners1.v1,rect.vCorners1.v2),
            t.position + new Vector3(rect.vCorners2.v0, rect.vCorners2.v1,rect.vCorners2.v2),
            t.position + new Vector3(rect.vCorners3.v0, rect.vCorners3.v1,rect.vCorners3.v2),
        };

        var cornerDists = new float[]
        {
            corners[0].x * corners[0].x + corners[0].z * corners[0].z,
            corners[1].x * corners[1].x + corners[1].z * corners[1].z,
            corners[2].x * corners[2].x + corners[2].z * corners[2].z,
            corners[3].x * corners[3].x + corners[3].z * corners[3].z,
        };

        float outerCornerDist = Mathf.Sqrt(cornerDists.Max());
        float innerCornerDist = Mathf.Sqrt(cornerDists.Min());
        Debug.Log("outerDist: " + outerCornerDist + ", innerDist: " + innerCornerDist);

        //calculate outer bound
        float outerBound = midOuterRadius;
        if (y >= midY)
        {
            outerBound += (topY - y) / (topY - midY) * (topOuterRadius - midOuterRadius);
        }
        else
        {
            outerBound += (botY - y) / (botY - midY) * (botOuterRadius - midOuterRadius);
        }

        Debug.Log("outerBound: " + outerBound + ", innerBound: " + innerBound);

        //if any corner is outside outerRadius or inside innerRadius, move play area inward/outward respectively by the difference
        if (innerCornerDist < innerBound)
        {
            Vector3 direction = new Vector3();
            direction = t.position;
            direction.z = 0;
            direction = direction.normalized * (innerBound - innerCornerDist);

            //apply directional bound fix to newPos
            newPos += direction;

        }
        if (outerCornerDist > outerBound)
        {
            Vector3 direction = new Vector3();
            direction = t.position;
            direction.z -= midY;
            direction = direction.normalized * (outerBound - outerCornerDist);

            //apply directional bound fix to newPos
            newPos += direction;
        }

        return newPos;
    }

    float SigmoidInterpolation(float t)
    {
        return 1.05f / (1 + Mathf.Exp(7.5f * (0.5f - t))) - 0.025f;
    }

    public enum InterpolationMode
    {
        Instant, SlowStart, SlowFinish, SlowBoth, SigmoidStart, SigmoidFinish, SigmoidBoth 
    }
}